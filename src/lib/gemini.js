
export const DEFAULT_GEMINI_MODELS = Object.freeze([
  "gemini-3.6-flash",
  "gemini-3.8-flash",
  "gemini-flash-latest",
]);

export function getGeminiModels() {
  const envModel = process.env.GEMINI_MODEL?.trim();
  if (envModel) {
    return [envModel, ...DEFAULT_GEMINI_MODELS.filter((m) => m !== envModel)];
  }
  return [...DEFAULT_GEMINI_MODELS];
}

export const GEMINI_MODELS = getGeminiModels();
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 14000;

export const LANGUAGE_NAMES = Object.freeze({
  en: "English",
  hi: "Hindi (हिन्दी)",
  mr: "Marathi (मराठी)",
  pa: "Punjabi (ਪੰਜਾਬੀ)",
  bn: "Bengali (বাংলা)",
  ta: "Tamil (தமிழ்)",
  te: "Telugu (తెలుగు)",
  gu: "Gujarati (ગુજરાતી)",
  kn: "Kannada (ಕನ್ನಡ)",
  ml: "Malayalam (മലയാളം)",
  or: "Odia (ଓଡ଼ିଆ)",
});

function sanitizeErrorMessage(msg) {
  if (typeof msg !== "string") return "";
  return msg
    .replace(/key=[a-zA-Z0-9_\-]+/gi, "key=[REDACTED]")
    .replace(/Bearer\s+[a-zA-Z0-9_\-]+/gi, "Bearer [REDACTED]");
}

/**
 * Builds the controlled agronomic recommendation prompt for Gemini.
 */
export function buildRecommendationPrompt({
  cropName,
  cropAge,
  ageUnit,
  soilType,
  location,
  budget,
  diagnosis,
  weather,
  agriculturalEvidence = [],
  language = "en",
}) {
  const topDisease = diagnosis?.diseases?.[0];
  const diseaseName = topDisease?.name || "Unspecified condition / general distress";
  const diseaseConfidence =
    typeof topDisease?.probability === "number"
      ? `${(topDisease.probability * 100).toFixed(1)}%`
      : "Not provided";
  const otherDiseases = (diagnosis?.diseases || [])
    .slice(1, 4)
    .map((d) => `${d.name} (${typeof d.probability === "number" ? (d.probability * 100).toFixed(1) + "%" : "N/A"})`)
    .join(", ");

  let weatherSection = "Current weather data is currently unavailable for this farm.";
  if (weather && weather.available) {
    weatherSection = `
- Resolved Location: ${weather.resolvedLocation || location}
- Temperature: ${weather.temperatureC ?? "N/A"} °C
- Relative Humidity: ${weather.humidityPercent ?? "N/A"}%
- Current Precipitation: ${weather.precipitationMm ?? 0} mm
- Forecast Precipitation (24h): ${weather.precipitationForecastMm ?? "N/A"} mm
- Max Rain Probability: ${weather.precipitationProbabilityMax ?? "N/A"}%
- Wind Speed: ${weather.windSpeedKmh ?? "N/A"} km/h
- Operational Spray Advisory: ${weather.sprayAdvisory || "Standard conditions"}
`.trim();
  }

  let evidenceSection = "No official institutional agricultural advisory bulletins could be retrieved for this crop/disease combination.";
  if (Array.isArray(agriculturalEvidence) && agriculturalEvidence.length > 0) {
    evidenceSection = agriculturalEvidence
      .map((ev, index) => {
        return `[Source ${index + 1}]
Title: ${ev.title}
Publisher: ${ev.publisher || ev.sourceName || "Agricultural Institution"}
URL: ${ev.url}
Verified Content Excerpt:
${(ev.content || "").slice(0, 1500)}
`;
      })
      .join("\n---\n");
  }

  const targetLanguage = LANGUAGE_NAMES[language] || (language && language !== "en" ? language : null);
  const languageRule = targetLanguage
    ? `\n9. LANGUAGE REQUIREMENT: You MUST generate all human-readable explanations (summary, whatToDo items, whatToAvoid items, estimatedCost basis, riskIfUntreated, and reasoning items) in ${targetLanguage}. Keep JSON keys strictly in English as shown below.`
    : "";

  return `You are FarmWise AI, an expert, conservative agricultural advisor specializing in Indian agronomy and crop disease management.

FARMER CONTEXT:
- Crop: ${cropName}
- Crop Stage / Age: ${cropAge} ${ageUnit || "days"}
- Soil Type: ${soilType}
- Farm Location: ${location}
- Farmer Treatment Budget: ${budget ? "₹" + budget : "Not specified"}

DISEASE SCREENING (AUTOMATED COMPUTER VISION ESTIMATE):
- Most Likely Suspected Disease: ${diseaseName}
- AI Screening Confidence: ${diseaseConfidence}
- Other Potential Matches: ${otherDiseases || "None noted"}
CRITICAL NOTICE: This is an automated visual identification estimate and is NOT a laboratory-confirmed diagnosis. Always recommend initial non-destructive field verification before chemical intervention.

WEATHER CONDITIONS & OPERATIONAL CONSTRAINTS:
${weatherSection}

GROUNDED AGRICULTURAL EVIDENCE:
${evidenceSection}

INSTRUCTIONS & RULES:
1. Ground your recommendations on verified agronomic practices and the provided agricultural evidence.
2. DO NOT hallucinate pesticide dosages or dangerous chemical mixtures. Prefer approved Central Insecticide Board & Registration Committee (CIBRC) / ICAR guidelines.
3. If weather indicates imminent rain (>= 5 mm) or wind (> 15 km/h), EXPLICITLY advise against foliar spraying to prevent chemical wash-off and environmental contamination.
4. In "whatToDo", prioritize:
   a. Cultural practices and immediate field sanitation (removing infected leaves).
   b. Safe organic / bio-control remedies (e.g. Neem formulations, Trichoderma).
   c. If chemical intervention is warranted, provide targeted, approved fungicide/insecticide names with standard dilution rates (e.g. per litre of water), keeping within the farmer's budget if possible.
5. In "whatToAvoid", warn against common damaging mistakes (e.g. overhead irrigation, overdosing, spraying during heat of the day, mixing incompatible chemicals).
6. In "estimatedCost", estimate the treatment cost in INR (Indian Rupees) with an explicit explanation of what it covers. If budget was specified, evaluate whether the plan fits within budget.
7. In "sources", cite ONLY the exact URLs and titles provided in the GROUNDED AGRICULTURAL EVIDENCE above. If no evidence was provided, return an empty array []. NEVER fabricate citations or URLs.
8. Output MUST be valid, parseable JSON only conforming strictly to the requested schema.${languageRule}

RESPONSE JSON SCHEMA:
{
  "summary": "Concise 1-2 sentence overview of diagnosis and primary recommendation",
  "diagnosis": {
    "diseaseName": "${diseaseName}",
    "confidence": ${typeof topDisease?.probability === "number" ? topDisease.probability : "null"},
    "severity": "Mild" | "Moderate" | "Severe",
    "isConfirmed": false
  },
  "weather": {
    "available": ${weather?.available ? "true" : "false"},
    "temperatureC": ${typeof weather?.temperatureC === "number" ? weather.temperatureC : "null"},
    "humidityPercent": ${typeof weather?.humidityPercent === "number" ? weather.humidityPercent : "null"},
    "precipitationForecastMm": ${typeof weather?.precipitationForecastMm === "number" ? weather.precipitationForecastMm : "null"},
    "windSpeedKmh": ${typeof weather?.windSpeedKmh === "number" ? weather.windSpeedKmh : "null"},
    "sprayAdvisory": "${weather?.sprayAdvisory ? weather.sprayAdvisory.replace(/"/g, "'") : ""}",
    "retrievedAt": "${weather?.retrievedAt || new Date().toISOString()}"
  },
  "actionPlan": {
    "whatToDo": [
      "Step 1...",
      "Step 2..."
    ],
    "whatToAvoid": [
      "Avoid 1...",
      "Avoid 2..."
    ],
    "estimatedCost": {
      "amount": 450,
      "currency": "INR",
      "basis": "Explanation of treatment costs and inputs"
    },
    "riskIfUntreated": "Consequences of delayed intervention...",
    "checkAgainInDays": 5
  },
  "reasoning": [
    "Agronomic reasoning point 1...",
    "Agronomic reasoning point 2..."
  ],
  "sources": [
    {
      "title": "Title from provided evidence",
      "url": "https://..."
    }
  ]
}`;
}

/**
 * Validates and sanitizes Gemini JSON output against the required contract.
 */
export function validateRecommendation(raw, { diagnosis, weather, agriculturalEvidence = [] }) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Gemini response is not a valid JSON object.");
  }

  const topDisease = diagnosis?.diseases?.[0];
  const expectedDiseaseName = topDisease?.name || "Unspecified condition";

  // Validate Summary
  const summary =
    typeof raw.summary === "string" && raw.summary.trim().length > 0
      ? raw.summary.trim()
      : `Diagnosis recommendations for ${expectedDiseaseName}.`;

  // Validate Diagnosis block
  const rawDiag = raw.diagnosis || {};
  const validatedDiagnosis = {
    diseaseName:
      typeof rawDiag.diseaseName === "string" && rawDiag.diseaseName.trim()
        ? rawDiag.diseaseName.trim()
        : expectedDiseaseName,
    confidence:
      typeof rawDiag.confidence === "number"
        ? Math.min(Math.max(rawDiag.confidence, 0), 1)
        : typeof topDisease?.probability === "number"
        ? topDisease.probability
        : null,
    severity: ["Mild", "Moderate", "Severe"].includes(rawDiag.severity)
      ? rawDiag.severity
      : "Moderate",
    isConfirmed: false, // Must remain false as this is an AI visual estimate
  };

  // Validate Weather block
  const rawWeather = raw.weather || {};
  const validatedWeather = {
    available: Boolean(weather?.available ?? rawWeather.available),
    temperatureC:
      typeof weather?.temperatureC === "number"
        ? weather.temperatureC
        : typeof rawWeather.temperatureC === "number"
        ? rawWeather.temperatureC
        : null,
    humidityPercent:
      typeof weather?.humidityPercent === "number"
        ? weather.humidityPercent
        : typeof rawWeather.humidityPercent === "number"
        ? rawWeather.humidityPercent
        : null,
    precipitationForecastMm:
      typeof weather?.precipitationForecastMm === "number"
        ? weather.precipitationForecastMm
        : typeof rawWeather.precipitationForecastMm === "number"
        ? rawWeather.precipitationForecastMm
        : null,
    windSpeedKmh:
      typeof weather?.windSpeedKmh === "number"
        ? weather.windSpeedKmh
        : typeof rawWeather.windSpeedKmh === "number"
        ? rawWeather.windSpeedKmh
        : null,
    sprayAdvisory:
      weather?.sprayAdvisory ||
      (typeof rawWeather.sprayAdvisory === "string" ? rawWeather.sprayAdvisory : null),
    retrievedAt: weather?.retrievedAt || rawWeather.retrievedAt || new Date().toISOString(),
  };

  // Validate Action Plan
  const rawPlan = raw.actionPlan || {};

  const whatToDo = Array.isArray(rawPlan.whatToDo)
    ? rawPlan.whatToDo.filter((item) => typeof item === "string" && item.trim().length > 0)
    : [];

  if (whatToDo.length === 0) {
    whatToDo.push("Inspect the affected plants daily and isolate diseased foliage.");
    whatToDo.push("Consult your nearest Krishi Vigyan Kendra (KVK) or extension officer for local confirmation.");
  }

  const whatToAvoid = Array.isArray(rawPlan.whatToAvoid)
    ? rawPlan.whatToAvoid.filter((item) => typeof item === "string" && item.trim().length > 0)
    : [];

  if (whatToAvoid.length === 0) {
    whatToAvoid.push("Avoid overhead sprinkler irrigation while leaves show active lesions.");
    whatToAvoid.push("Do not apply unverified chemical mixtures or exceed recommended application rates.");
  }

  const rawCost = rawPlan.estimatedCost || {};
  const estimatedCost = {
    amount:
      typeof rawCost.amount === "number" && rawCost.amount >= 0
        ? Math.round(rawCost.amount)
        : null,
    currency: "INR",
    basis:
      typeof rawCost.basis === "string" && rawCost.basis.trim()
        ? rawCost.basis.trim()
        : null,
  };

  const riskIfUntreated =
    typeof rawPlan.riskIfUntreated === "string" && rawPlan.riskIfUntreated.trim()
      ? rawPlan.riskIfUntreated.trim()
      : "If untreated, fungal and bacterial pathogens can spread rapidly to neighboring crop rows, leading to significant yield loss.";

  const checkAgainInDays =
    typeof rawPlan.checkAgainInDays === "number" && rawPlan.checkAgainInDays > 0
      ? Math.round(rawPlan.checkAgainInDays)
      : 5;

  // Validate Reasoning
  const reasoning = Array.isArray(raw.reasoning)
    ? raw.reasoning.filter((item) => typeof item === "string" && item.trim().length > 0)
    : ["Recommendations are tailored to the detected visual symptoms and current local weather conditions."];

  // Validate Sources (Crucial: filter out hallucinated citations!)
  const approvedUrls = new Set(
    (agriculturalEvidence || [])
      .map((e) => (typeof e?.url === "string" ? e.url.trim().toLowerCase() : ""))
      .filter(Boolean)
  );

  const validatedSources = [];
  if (Array.isArray(raw.sources)) {
    for (const source of raw.sources) {
      if (source && typeof source.url === "string") {
        const normalizedUrl = source.url.trim().toLowerCase();
        // Only accept citations that match retrieved evidence URLs
        if (approvedUrls.has(normalizedUrl)) {
          const matchingEvidence = agriculturalEvidence.find(
            (e) => e?.url?.trim()?.toLowerCase() === normalizedUrl
          );
          validatedSources.push({
            title: source.title || matchingEvidence?.title || "Agricultural Advisory",
            url: source.url.trim(),
            publisher: matchingEvidence?.publisher || matchingEvidence?.sourceName || "Official Agricultural Source",
          });
        }
      }
    }
  }

  return {
    summary,
    diagnosis: validatedDiagnosis,
    weather: validatedWeather,
    actionPlan: {
      whatToDo,
      whatToAvoid,
      estimatedCost,
      riskIfUntreated,
      checkAgainInDays,
    },
    reasoning,
    sources: validatedSources,
  };
}

/**
 * Executes a Gemini prompt with JSON response enforcement across model fallbacks.
 */
export async function executeGeminiJsonPrompt(prompt, { models = getGeminiModels(), temperature = 0.2 } = {}) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in server environment.");
  }

  let lastError = null;
  const candidateModels = Array.isArray(models) && models.length > 0 ? models : getGeminiModels();

  for (const model of candidateModels) {
    try {
      const url = `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature,
          },
        }),
      });

      if (!response.ok) {
        if (response.status === 503 || response.status === 429) {
          await new Promise((r) => setTimeout(r, 1200));
          try {
            const retryRes = await fetch(url, {
              method: "POST",
              signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  responseMimeType: "application/json",
                  temperature,
                },
              }),
            });

            if (retryRes.ok) {
              const retryJson = await retryRes.json();
              const retryText = retryJson?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (retryText) {
                try {
                  return JSON.parse(retryText);
                } catch {
                  const jsonMatch = retryText.match(/```json\s*([\s\S]*?)\s*```/) || retryText.match(/\{[\s\S]*\}/);
                  if (jsonMatch) return JSON.parse(jsonMatch[1] || jsonMatch[0]);
                }
              }
            }
          } catch {
            // Ignore retry failure and proceed to log and fallback
          }
        }

        const errorBody = await response.text().catch(() => "");
        const sanitizedBody = sanitizeErrorMessage(errorBody.slice(0, 300));
        const status = response.status;

        console.warn(
          `[Gemini API] Model "${model}" failed (HTTP ${status}): ${sanitizedBody}. Trying fallback model if available...`
        );

        throw new Error(
          `Gemini API (${model}) failed with status ${status}: ${sanitizedBody}`
        );
      }

      const result = await response.json();
      const candidateText =
        result?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!candidateText) {
        console.warn(
          `[Gemini API] Model "${model}" returned an empty candidate response. Trying fallback model if available...`
        );
        throw new Error(`Gemini (${model}) returned an empty candidate response.`);
      }

      let parsedJson;
      try {
        parsedJson = JSON.parse(candidateText);
      } catch (err) {
        const jsonMatch =
          candidateText.match(/```json\s*([\s\S]*?)\s*```/) ||
          candidateText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedJson = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          console.warn(
            `[Gemini API] Model "${model}" returned non-JSON output. Trying fallback model if available...`
          );
          throw new Error("Could not parse Gemini output as JSON: " + err.message);
        }
      }

      return parsedJson;
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  throw (
    lastError ||
    new Error(
      `Failed to generate output from all attempted Gemini models: ${candidateModels.join(", ")}`
    )
  );
}

/**
 * Invokes the Google Gemini API to generate structured agricultural recommendations.
 */
export async function generateGeminiRecommendation({
  cropName,
  cropAge,
  ageUnit,
  soilType,
  location,
  budget,
  diagnosis,
  weather,
  agriculturalEvidence = [],
  language = "en",
  models = getGeminiModels(),
}) {
  const prompt = buildRecommendationPrompt({
    cropName,
    cropAge,
    ageUnit,
    soilType,
    location,
    budget,
    diagnosis,
    weather,
    agriculturalEvidence,
    language,
  });

  const parsedJson = await executeGeminiJsonPrompt(prompt, { models });

  return validateRecommendation(parsedJson, {
    diagnosis,
    weather,
    agriculturalEvidence,
  });
}

/**
 * Builds the agronomic translation prompt for translating an existing consultation.
 */
export function buildConsultationTranslationPrompt({
  recommendation,
  targetLanguage,
  cropName,
}) {
  const targetLanguageLabel = LANGUAGE_NAMES[targetLanguage] || targetLanguage;

  return `You are FarmWise AI's expert agricultural translation engine specializing in Indian agricultural languages and agronomic terminology.

TASK:
Accurately translate the following agricultural consultation JSON from English into ${targetLanguageLabel}.
Crop Name Context: ${cropName || "Crop"}

SOURCE CONSULTATION JSON TO TRANSLATE:
${JSON.stringify(recommendation, null, 2)}

STRICT AGRO-SAFETY & TRANSLATION RULES:
1. Translate all human-readable instructional text into fluent, natural ${targetLanguageLabel}:
   - "summary"
   - "actionPlan.whatToDo" (translate each action step carefully)
   - "actionPlan.whatToAvoid" (translate each precaution / caution carefully)
   - "actionPlan.estimatedCost.basis" (translate cost explanation)
   - "actionPlan.riskIfUntreated" (translate risk explanation)
   - "reasoning" (translate each agronomic rationale point)
   - "weather.sprayAdvisory" (translate weather advisory note if present)
2. PRESERVE NUMERICAL VALUES EXACTLY:
   - "actionPlan.estimatedCost.amount" MUST remain strictly ${recommendation?.actionPlan?.estimatedCost?.amount ?? "null"}.
   - "actionPlan.checkAgainInDays" MUST remain strictly ${recommendation?.actionPlan?.checkAgainInDays ?? 5}.
   - All numbers, concentrations (e.g. 2 ml/L, 0.5%), temperatures, rainfall mm, and percentages MUST be preserved exactly.
3. PRESERVE CHEMICAL AND SCIENTIFIC TERMINOLOGY:
   - Keep chemical names recognizable (e.g. Copper Oxychloride, Mancozeb, Imidacloprid, Trichoderma viride, Neem oil). You may write the English name followed by the local script transliteration in parentheses if helpful.
   - Botanical and pathogen scientific names must remain in Latin script.
4. STRICT PRESERVATION OF ORIGINAL MEDICAL/AGRONOMIC INTENT:
   - Do NOT invent new recommendations or treatments.
   - Do NOT omit any caution or warning.
   - Retain the exact level of certainty or caution from the original text.
5. PRESERVE ALL CITATIONS AND SOURCES:
   - Keep "sources" array identical (URLs and titles).
6. OUTPUT FORMAT:
   - Output MUST be valid, parseable JSON only conforming strictly to the requested schema.
   - Keep all JSON object keys in English.`;
}

/**
 * Validates and preserves integrity of a translated consultation.
 */
export function validateTranslatedConsultation(raw, original) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Translated consultation response is not a valid JSON object.");
  }

  // Preserve canonical diagnosis metadata with translated diseaseName if present
  const diagnosis = {
    ...original.diagnosis,
    diseaseName:
      typeof raw.diagnosis?.diseaseName === "string" && raw.diagnosis.diseaseName.trim()
        ? raw.diagnosis.diseaseName.trim()
        : original.diagnosis.diseaseName,
  };

  // Preserve canonical weather metadata with translated sprayAdvisory if present
  const weather = {
    ...original.weather,
    sprayAdvisory:
      typeof raw.weather?.sprayAdvisory === "string" && raw.weather.sprayAdvisory.trim()
        ? raw.weather.sprayAdvisory.trim()
        : original.weather?.sprayAdvisory || null,
  };

  // Validate action plan
  const rawPlan = raw.actionPlan || {};
  const origPlan = original.actionPlan || {};

  const whatToDo = Array.isArray(rawPlan.whatToDo) && rawPlan.whatToDo.length > 0
    ? rawPlan.whatToDo.filter((item) => typeof item === "string" && item.trim().length > 0)
    : origPlan.whatToDo || [];

  const whatToAvoid = Array.isArray(rawPlan.whatToAvoid) && rawPlan.whatToAvoid.length > 0
    ? rawPlan.whatToAvoid.filter((item) => typeof item === "string" && item.trim().length > 0)
    : origPlan.whatToAvoid || [];

  const estimatedCost = {
    amount: origPlan.estimatedCost?.amount ?? null, // Strictly preserve original amount
    currency: "INR",
    basis:
      typeof rawPlan.estimatedCost?.basis === "string" && rawPlan.estimatedCost.basis.trim()
        ? rawPlan.estimatedCost.basis.trim()
        : origPlan.estimatedCost?.basis || null,
  };

  const riskIfUntreated =
    typeof rawPlan.riskIfUntreated === "string" && rawPlan.riskIfUntreated.trim()
      ? rawPlan.riskIfUntreated.trim()
      : origPlan.riskIfUntreated;

  const checkAgainInDays = origPlan.checkAgainInDays ?? 5; // Strictly preserve original days

  const reasoning = Array.isArray(raw.reasoning) && raw.reasoning.length > 0
    ? raw.reasoning.filter((item) => typeof item === "string" && item.trim().length > 0)
    : origPlan.reasoning || [];

  const summary =
    typeof raw.summary === "string" && raw.summary.trim()
      ? raw.summary.trim()
      : original.summary;

  return {
    summary,
    diagnosis,
    weather,
    actionPlan: {
      whatToDo,
      whatToAvoid,
      estimatedCost,
      riskIfUntreated,
      checkAgainInDays,
    },
    reasoning,
    sources: original.sources || [], // Strictly preserve original sources
  };
}

/**
 * Translates an existing consultation using Gemini with strict preservation of numerical and agronomic data.
 */
export async function translateConsultationWithGemini({
  recommendation,
  targetLanguage,
  cropName,
  models = getGeminiModels(),
}) {
  if (!targetLanguage || targetLanguage === "en") {
    return recommendation;
  }

  const prompt = buildConsultationTranslationPrompt({
    recommendation,
    targetLanguage,
    cropName,
  });

  const parsedJson = await executeGeminiJsonPrompt(prompt, { models, temperature: 0.1 });

  return validateTranslatedConsultation(parsedJson, recommendation);
}

/**
 * Builds the prompt for translating diagnosis overview strings.
 */
export function buildDiagnosisTranslationPrompt({
  cropName,
  diseaseName,
  otherDiseases = [],
  description,
  targetLanguage,
}) {
  const targetLanguageLabel = LANGUAGE_NAMES[targetLanguage] || targetLanguage;

  return `You are FarmWise AI's expert agricultural translation engine specializing in Indian languages.

TASK:
Translate the crop diagnosis overview information from English into ${targetLanguageLabel}.

INPUT DATA:
- Crop Name: ${cropName}
- Suspected Disease Name: ${diseaseName}
- Other Potential Conditions: ${otherDiseases.join(", ") || "None"}
- Analysis Description: ${description}

TRANSLATION RULES:
1. Translate "cropName" into common agricultural ${targetLanguageLabel} (e.g. Wheat -> गेहूं / கோதுமை / গম).
2. Translate "diseaseName" into common agricultural ${targetLanguageLabel} (e.g. Early Blight -> अगेती झुलसा / முன் தண்டு அழுகல்), preserving scientific or common English name in parentheses if helpful.
3. Translate the description into natural, conservative agricultural ${targetLanguageLabel}.
4. Return valid JSON only with keys: "cropName", "diseaseName", "description", "otherDiseases".`;
}

/**
 * Translates diagnosis overview fields using Gemini.
 */
export async function translateDiagnosisWithGemini({
  cropName,
  diseaseName,
  otherDiseases = [],
  description,
  targetLanguage,
  models = getGeminiModels(),
}) {
  if (!targetLanguage || targetLanguage === "en") {
    return {
      cropName,
      diseaseName,
      otherDiseases,
      description,
    };
  }

  const prompt = buildDiagnosisTranslationPrompt({
    cropName,
    diseaseName,
    otherDiseases,
    description,
    targetLanguage,
  });

  try {
    const parsedJson = await executeGeminiJsonPrompt(prompt, { models, temperature: 0.1 });

    return {
      cropName:
        typeof parsedJson?.cropName === "string" && parsedJson.cropName.trim()
          ? parsedJson.cropName.trim()
          : cropName,
      diseaseName:
        typeof parsedJson?.diseaseName === "string" && parsedJson.diseaseName.trim()
          ? parsedJson.diseaseName.trim()
          : diseaseName,
      otherDiseases:
        Array.isArray(parsedJson?.otherDiseases) && parsedJson.otherDiseases.length > 0
          ? parsedJson.otherDiseases
          : otherDiseases,
      description:
        typeof parsedJson?.description === "string" && parsedJson.description.trim()
          ? parsedJson.description.trim()
          : description,
    };
  } catch (err) {
    console.warn("Diagnosis translation failed gracefully:", err.message);
    return {
      cropName,
      diseaseName,
      otherDiseases,
      description,
    };
  }
}
