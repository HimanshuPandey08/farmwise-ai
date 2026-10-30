import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { retrieveWeather } from "@/lib/weather";
import {
  generateGeminiRecommendation,
  translateConsultationWithGemini,
} from "@/lib/gemini";

// In-flight generation locks to prevent duplicate concurrent generation for the same diagnosis
const activeGenerations = new Map();

/**
 * GET: Fetches an existing saved consultation for the given diagnosisId.
 */
export async function GET(request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in first." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const diagnosisId = searchParams.get("diagnosisId");
    const lang = searchParams.get("lang") || request.cookies.get("farmwise_lang")?.value || "en";

    if (!diagnosisId || typeof diagnosisId !== "string" || !diagnosisId.trim()) {
      return NextResponse.json(
        { error: "A diagnosisId parameter is required." },
        { status: 400 }
      );
    }

    const existing = await db.collection("consultations").findOne({
      diagnosisId: diagnosisId.trim(),
      userId: session.user.id,
    });

    if (!existing) {
      return NextResponse.json(
        { error: "No saved consultation found for this diagnosis.", notFound: true },
        { status: 404 }
      );
    }

    const canonicalRecommendation = existing.recommendation;
    let returnRecommendation = canonicalRecommendation;
    let isTranslated = false;

    if (lang && lang !== "en" && lang !== existing.language) {
      // 1. Check if cached in MongoDB translations
      if (existing.translations?.[lang]?.recommendation) {
        returnRecommendation = existing.translations[lang].recommendation;
        isTranslated = true;
      } else {
        // 2. Generate on-demand translation using translateConsultationWithGemini
        try {
          const translated = await translateConsultationWithGemini({
            recommendation: canonicalRecommendation,
            targetLanguage: lang,
            cropName: existing.cropName,
          });

          // 3. Cache translation safely in MongoDB without mutating original canonical recommendation
          await db.collection("consultations").updateOne(
            { diagnosisId: diagnosisId.trim(), userId: session.user.id },
            {
              $set: {
                [`translations.${lang}`]: {
                  recommendation: translated,
                  translatedAt: new Date(),
                },
                updatedAt: new Date(),
              },
            }
          );

          returnRecommendation = translated;
          isTranslated = true;
        } catch (translationErr) {
          console.warn(`Translation to ${lang} failed, using canonical:`, translationErr.message);
          returnRecommendation = canonicalRecommendation;
        }
      }
    }

    return NextResponse.json({
      success: true,
      consultation: returnRecommendation,
      canonicalConsultation: canonicalRecommendation,
      weatherContext: existing.weatherContext,
      evidenceSources: existing.agriculturalEvidenceMeta || [],
      isSaved: true,
      language: lang,
      isTranslated,
      createdAt: existing.createdAt,
    });
  } catch (error) {
    console.error("Fetch consultation failed:", error);
    return NextResponse.json(
      { error: "Failed to retrieve consultation." },
      { status: 500 }
    );
  }
}

/**
 * POST: Generates or reuses a saved consultation for the authenticated user's diagnosis.
 */
export async function POST(request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in first." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { diagnosisId, regenerate = false, language } = body;
    const targetLang = language || request.cookies.get("farmwise_lang")?.value || "en";

    if (!diagnosisId || typeof diagnosisId !== "string" || !diagnosisId.trim()) {
      return NextResponse.json(
        { error: "A valid diagnosisId is required." },
        { status: 400 }
      );
    }

    const normalizedDiagnosisId = diagnosisId.trim();

    // 1. Verify diagnosis ownership
    let objectId;
    try {
      objectId = new ObjectId(normalizedDiagnosisId);
    } catch {
      return NextResponse.json(
        { error: "Invalid diagnosis ID format." },
        { status: 400 }
      );
    }

    const diagnosisDoc = await db.collection("diagnoses").findOne({
      _id: objectId,
      userId: session.user.id,
    });

    if (!diagnosisDoc) {
      return NextResponse.json(
        { error: "Diagnosis not found or you are not authorized to view it." },
        { status: 404 }
      );
    }

    // 2. Return existing saved consultation if regeneration is not explicitly requested
    if (!regenerate) {
      const existing = await db.collection("consultations").findOne({
        diagnosisId: normalizedDiagnosisId,
        userId: session.user.id,
      });

      if (existing?.recommendation) {
        let returnRecommendation = existing.recommendation;
        let isTranslated = false;

        if (targetLang && targetLang !== "en" && targetLang !== existing.language) {
          if (existing.translations?.[targetLang]?.recommendation) {
            returnRecommendation = existing.translations[targetLang].recommendation;
            isTranslated = true;
          } else {
            try {
              const translated = await translateConsultationWithGemini({
                recommendation: existing.recommendation,
                targetLanguage: targetLang,
                cropName: existing.cropName,
              });

              await db.collection("consultations").updateOne(
                { diagnosisId: normalizedDiagnosisId, userId: session.user.id },
                {
                  $set: {
                    [`translations.${targetLang}`]: {
                      recommendation: translated,
                      translatedAt: new Date(),
                    },
                    updatedAt: new Date(),
                  },
                }
              );

              returnRecommendation = translated;
              isTranslated = true;
            } catch (err) {
              console.warn("Translation failed, falling back to canonical:", err.message);
            }
          }
        }

        return NextResponse.json({
          success: true,
          consultation: returnRecommendation,
          canonicalConsultation: existing.recommendation,
          weatherContext: existing.weatherContext,
          evidenceSources: existing.agriculturalEvidenceMeta || [],
          isSaved: true,
          cached: true,
          language: targetLang,
          isTranslated,
          createdAt: existing.createdAt,
        });
      }
    }

    // 3. Concurrency guard: check if generation is already in flight for this diagnosis
    const lockKey = `${session.user.id}:${normalizedDiagnosisId}:${targetLang}`;
    if (activeGenerations.has(lockKey)) {
      try {
        const inFlightResult = await activeGenerations.get(lockKey);
        return NextResponse.json({
          success: true,
          consultation: inFlightResult,
          isSaved: true,
          cached: true,
        });
      } catch {
        // If in-flight generation threw, fall through to retry
      }
    }

    // 4. Execute weather and agricultural evidence retrieval in parallel
    const generationPromise = (async () => {
      const suspectedDiseases = (diagnosisDoc.diagnosis?.diseases || []).map(
        (d) => d.name
      );

      const [weather, agriculturalEvidence] = await Promise.all([
        retrieveWeather(diagnosisDoc.location).catch((err) => {
          console.warn("Weather retrieval failed gracefully:", err.message);
          return { available: false, reason: "Weather service unavailable" };
        }),
        retrieveAgriculturalSources({
          cropName: diagnosisDoc.cropName,
          suspectedDiseases,
        }).catch((err) => {
          console.warn("Agricultural source retrieval failed gracefully:", err.message);
          return [];
        }),
      ]);

      // 5. Generate canonical recommendations with grounded Gemini engine in English
      const canonicalRecommendation = await generateGeminiRecommendation({
        cropName: diagnosisDoc.cropName,
        cropAge: diagnosisDoc.cropAge,
        ageUnit: diagnosisDoc.ageUnit,
        soilType: diagnosisDoc.soilType,
        location: diagnosisDoc.location,
        budget: diagnosisDoc.budget,
        diagnosis: diagnosisDoc.diagnosis,
        weather,
        agriculturalEvidence,
        language: "en",
      });

      let initialTranslations = {};
      let returnRecommendation = canonicalRecommendation;

      // Translate to target language if non-English requested
      if (targetLang && targetLang !== "en") {
        try {
          const translated = await translateConsultationWithGemini({
            recommendation: canonicalRecommendation,
            targetLanguage: targetLang,
            cropName: diagnosisDoc.cropName,
          });
          initialTranslations[targetLang] = {
            recommendation: translated,
            translatedAt: new Date(),
          };
          returnRecommendation = translated;
        } catch (trErr) {
          console.warn("Initial translation failed:", trErr.message);
        }
      }

      // 6. Persist consultation to MongoDB
      const consultationRecord = {
        userId: session.user.id,
        diagnosisId: normalizedDiagnosisId,
        cropName: diagnosisDoc.cropName,
        language: "en",
        recommendation: canonicalRecommendation,
        translations: initialTranslations,
        weatherContext: weather,
        agriculturalEvidenceMeta: (agriculturalEvidence || []).map((ev) => ({
          title: ev.title,
          publisher: ev.publisher || ev.sourceName || "Official Agricultural Source",
          url: ev.url,
          retrievedAt: ev.retrievedAt,
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection("consultations").updateOne(
        { diagnosisId: normalizedDiagnosisId, userId: session.user.id },
        { $set: consultationRecord },
        { upsert: true }
      );

      return returnRecommendation;
    })();

    activeGenerations.set(lockKey, generationPromise);

    try {
      const recommendation = await generationPromise;
      return NextResponse.json({
        success: true,
        consultation: recommendation,
        isSaved: true,
        regenerated: Boolean(regenerate),
      });
    } finally {
      activeGenerations.delete(lockKey);
    }
  } catch (error) {
    console.error("Generate recommendations failed:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate agricultural recommendations.";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
