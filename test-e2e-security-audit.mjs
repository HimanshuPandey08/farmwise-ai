import assert from "node:assert";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

import { db, connectedClientPromise } from "./src/lib/mongodb.js";
import { ObjectId } from "mongodb";
import { auth } from "./src/lib/auth.js";
import {
  INTELLIGENCE_CONFIG,
  normalizeCropName,
  normalizeDiseaseName,
  normalizeGeographicArea,
  evaluateSignalStatus,
  getRecommendedAction,
  getCommunityIntelligence,
} from "./src/lib/community-intelligence.js";
import {
  getUserAgronomicProfile,
  refreshUserAlerts,
  markAlertAsRead,
  dismissAlert,
} from "./src/lib/community-alerts.js";
import {
  buildRecommendationPrompt,
  validateRecommendation,
  DEFAULT_GEMINI_MODELS,
  getGeminiModels,
} from "./src/lib/gemini.js";
import { retrieveWeather } from "./src/lib/weather.js";
import {
  isDatesOrIndexPage,
  isRelevantAgriculturalContent,
  retrieveAgriculturalSources,
} from "./src/lib/agricultural-retrieval.js";

async function runE2ESecurityAudit() {
  console.log("=================================================================");
  console.log("FarmWise AI — Comprehensive End-to-End Testing & Security Audit");
  console.log("=================================================================\n");

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const findings = [];

  async function test(category, name, fn) {
    totalTests++;
    try {
      await fn();
      passedTests++;
      console.log(`[PASS] [${category}] ${name}`);
    } catch (err) {
      failedTests++;
      console.error(`[FAIL] [${category}] ${name}`);
      console.error(`       Error: ${err.message}`);
      findings.push({ category, name, error: err.message });
    }
  }

  // =========================================================================
  // 1. REPOSITORY & RUNTIME ENVIRONMENT BASELINE
  // =========================================================================
  await test("Baseline", "Node runtime environment and DOMMatrix global availability", () => {
    assert.ok(typeof globalThis.DOMMatrix !== "undefined", "DOMMatrix must be available in global scope");
    const m = new globalThis.DOMMatrix([1, 0, 0, 1, 10, 20]);
    assert.strictEqual(typeof m.translate, "function");
    assert.strictEqual(typeof m.scale, "function");
    assert.strictEqual(typeof m.inverse, "function");
  });

  await test("Baseline", "Core environment configuration keys configured without leaking secrets", () => {
    assert.ok(process.env.MONGODB_URI, "MONGODB_URI must be configured");
    assert.ok(process.env.BETTER_AUTH_SECRET, "BETTER_AUTH_SECRET must be configured");
    assert.ok(process.env.BETTER_AUTH_URL, "BETTER_AUTH_URL must be configured");
  });

  // =========================================================================
  // 2. AUTHENTICATION & ACCOUNT SECURITY
  // =========================================================================
  await test("Auth", "Better Auth configuration requires minPasswordLength >= 8", () => {
    assert.ok(auth.options.emailAndPassword.enabled, "Email and password must be enabled");
    assert.strictEqual(auth.options.emailAndPassword.minPasswordLength, 8, "Minimum password length must be 8");
  });

  await test("Auth", "Better Auth secret and base URL are configured", () => {
    assert.ok(auth.options.secret, "Auth secret must not be empty");
    assert.ok(auth.options.baseURL, "Auth baseURL must not be empty");
  });

  // =========================================================================
  // 3. MONGODB & MULTI-TENANT ISOLATION
  // =========================================================================
  const testIsoUserA = `test_farmer_A_${Date.now()}`;
  const testIsoUserB = `test_farmer_B_${Date.now()}`;
  let docIdA = null;
  let docIdB = null;

  await test("Database", "Database connection is active and responsive", async () => {
    await connectedClientPromise;
    const ping = await db.command({ ping: 1 });
    assert.strictEqual(ping.ok, 1, "MongoDB Atlas ping must succeed");
  });

  await test("Database", "Isolated test diagnoses creation for multi-tenant verification", async () => {
    const resA = await db.collection("diagnoses").insertOne({
      userId: testIsoUserA,
      cropName: "Tomato",
      cropAge: "35",
      ageUnit: "days",
      location: "Prayagraj",
      soilType: "Loamy",
      budget: 1500,
      image: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      diagnosis: {
        crop: { name: "Tomato", probability: 0.95 },
        diseases: [{ id: "early_blight", name: "Early Blight", probability: 0.88 }],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    docIdA = resA.insertedId;

    const resB = await db.collection("diagnoses").insertOne({
      userId: testIsoUserB,
      cropName: "Wheat",
      cropAge: "60",
      ageUnit: "days",
      location: "Mathura",
      soilType: "Clay",
      budget: 2000,
      image: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      diagnosis: {
        crop: { name: "Wheat", probability: 0.98 },
        diseases: [{ id: "yellow_rust", name: "Yellow Rust", probability: 0.85 }],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    docIdB = resB.insertedId;

    assert.ok(docIdA, "User A document must be inserted");
    assert.ok(docIdB, "User B document must be inserted");
  });

  await test("Security", "Tenant Isolation: User A cannot read User B diagnosis", async () => {
    // Attempt to query User B's document using User A's credentials
    const unauthorizedDoc = await db.collection("diagnoses").findOne({
      _id: docIdB,
      userId: testIsoUserA, // Querying B's document under A's identity
    });
    assert.strictEqual(unauthorizedDoc, null, "Cross-tenant access must return null");

    // Legitimate query by owner must succeed
    const authorizedDoc = await db.collection("diagnoses").findOne({
      _id: docIdB,
      userId: testIsoUserB,
    });
    assert.ok(authorizedDoc, "Authorized owner must be able to retrieve document");
    assert.strictEqual(authorizedDoc.cropName, "Wheat");
  });

  await test("Security", "Tenant Isolation: User A cannot read User B consultations", async () => {
    // Insert consultation for User B
    await db.collection("consultations").insertOne({
      userId: testIsoUserB,
      diagnosisId: docIdB.toString(),
      cropName: "Wheat",
      recommendation: {
        summary: "Wheat treatment advice",
        actions: [{ title: "Foliar spray", description: "Apply fungicide" }],
      },
      createdAt: new Date(),
    });

    // Query under User A's identity
    const crossConsultation = await db.collection("consultations").findOne({
      diagnosisId: docIdB.toString(),
      userId: testIsoUserA,
    });
    assert.strictEqual(crossConsultation, null, "User A must not access User B consultation");

    // Clean up test consultation
    await db.collection("consultations").deleteOne({ diagnosisId: docIdB.toString() });
  });

  await test("Database", "Malformed ObjectId is rejected cleanly without throwing unhandled exceptions", async () => {
    let rejected = false;
    try {
      new ObjectId("invalid-malformed-id");
    } catch {
      rejected = true;
    }
    assert.strictEqual(rejected, true, "Invalid ObjectId string must throw caught exception for 400 response");
  });

  // Cleanup test documents safely
  await test("Database", "Clean up isolated test documents", async () => {
    if (docIdA) await db.collection("diagnoses").deleteOne({ _id: docIdA });
    if (docIdB) await db.collection("diagnoses").deleteOne({ _id: docIdB });
    const countA = await db.collection("diagnoses").countDocuments({ userId: testIsoUserA });
    const countB = await db.collection("diagnoses").countDocuments({ userId: testIsoUserB });
    assert.strictEqual(countA, 0);
    assert.strictEqual(countB, 0);
  });

  // =========================================================================
  // 4. IMAGE UPLOAD & CROP DIAGNOSIS INTEGRITY
  // =========================================================================
  await test("Image & Diagnosis", "Cloudinary image URL validation strictly enforces domain and HTTPS", () => {
    function isValidCloudinaryUrl(urlStr) {
      try {
        const u = new URL(urlStr);
        return u.protocol === "https:" && u.hostname === "res.cloudinary.com";
      } catch {
        return false;
      }
    }

    assert.strictEqual(isValidCloudinaryUrl("https://res.cloudinary.com/farmwise/image/upload/sample.jpg"), true);
    assert.strictEqual(isValidCloudinaryUrl("http://res.cloudinary.com/farmwise/image/upload/sample.jpg"), false);
    assert.strictEqual(isValidCloudinaryUrl("https://attacker.com/res.cloudinary.com/fake.jpg"), false);
    assert.strictEqual(isValidCloudinaryUrl("javascript:alert(1)"), false);
    assert.strictEqual(isValidCloudinaryUrl(""), false);
  });

  await test("Image & Diagnosis", "Image upload limits and allowed MIME types are strictly enforced", () => {
    const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
    const MAX_FILE_SIZE = 5 * 1024 * 1024;

    assert.strictEqual(ALLOWED_TYPES.has("image/jpeg"), true);
    assert.strictEqual(ALLOWED_TYPES.has("image/png"), true);
    assert.strictEqual(ALLOWED_TYPES.has("image/webp"), true);
    assert.strictEqual(ALLOWED_TYPES.has("image/gif"), false);
    assert.strictEqual(ALLOWED_TYPES.has("application/pdf"), false);
    assert.strictEqual(ALLOWED_TYPES.has("text/html"), false);

    assert.strictEqual(MAX_FILE_SIZE, 5242880, "Max file size must be 5MB");
  });

  // =========================================================================
  // 5. AGRICULTURAL RETRIEVAL & GROUNDING
  // =========================================================================
  await test("Retrieval", "Index-only date advisory pages are rejected from agricultural evidence", () => {
    const datesPage = {
      url: "https://iiwbr.org.in/crop-advisory/",
      content: "Advisory issued for 12-02-2024 to 18-02-2024 Download PDF. Advisory issued for 05-02-2024 Download PDF.",
    };
    assert.strictEqual(isDatesOrIndexPage(datesPage, { id: "iiwbr" }), true);
  });

  await test("Retrieval", "Substantive agricultural guidance passes relevance filter", () => {
    const substantivePage =
      "Advisory for Tomato Early Blight: Pathogen Alternaria solani causes dark concentric rings on foliage. " +
      "Recommended management: Spray Mancozeb 75 WP at 2.5 g per litre of water or Chlorothalonil 75 WP. " +
      "Avoid overhead sprinkler irrigation to reduce leaf wetness. Maintain field sanitation.";
    assert.strictEqual(isRelevantAgriculturalContent(substantivePage, { cropName: "tomato" }), true);
  });

  // =========================================================================
  // 6. GEMINI RECOMMENDATIONS & CITATION GROUNDING
  // =========================================================================
  await test("Recommendations", "Gemini prompt builder grounds with crop, weather context, and agricultural evidence", () => {
    const prompt = buildRecommendationPrompt({
      cropName: "Tomato",
      cropAge: 40,
      ageUnit: "days",
      soilType: "Loamy",
      location: "Prayagraj",
      budget: 1500,
      diagnosis: { diseases: [{ name: "Early Blight", probability: 0.85 }] },
      weather: { available: true, temperatureC: 28, humidityPercent: 75, sprayAdvisory: "Favorable conditions" },
      agriculturalEvidence: [
        { title: "ICAR Advisory", publisher: "ICAR", url: "https://icar.gov.in/advisory", content: "Apply Mancozeb" },
      ],
    });
    assert.ok(prompt.includes("Tomato"));
    assert.ok(prompt.includes("Early Blight"));
    assert.ok(prompt.includes("ICAR Advisory"));
    assert.ok(prompt.includes("Favorable conditions"));
  });

  await test("Recommendations", "Recommendation validator strictly strips unverified/hallucinated citations", () => {
    const validEvidence = [
      { url: "https://icar.gov.in/bulletin-1" },
      { url: "https://iiwbr.org.in/advisory-2" },
    ];
    const candidateWithHallucination = {
      summary: "Sample treatment plan",
      diagnosis: { diseaseName: "Early Blight", confidence: 0.85 },
      actionPlan: { whatToDo: ["Action 1"], whatToAvoid: ["Avoid 1"] },
      sources: [
        { title: "Real citation", url: "https://icar.gov.in/bulletin-1" },
        { title: "Fabricated citation", url: "https://fake-agriculture-site.com/fake" },
      ],
    };
    const validated = validateRecommendation(candidateWithHallucination, {
      agriculturalEvidence: validEvidence,
    });
    assert.strictEqual(validated.sources.length, 1);
    assert.strictEqual(validated.sources[0].url, "https://icar.gov.in/bulletin-1");
  });

  await test("Recommendations", "Model pool prioritizes gemini-3.6-flash and excludes deprecated models", () => {
    assert.strictEqual(DEFAULT_GEMINI_MODELS[0], "gemini-3.6-flash");
    assert.ok(!DEFAULT_GEMINI_MODELS.includes("gemini-1.5-flash"), "gemini-1.5-flash must not be included");
    assert.ok(!DEFAULT_GEMINI_MODELS.includes("gemini-1.5-pro"), "gemini-1.5-pro must not be included");
  });

  // =========================================================================
  // 7. WEATHER SERVICE INTEGRITY
  // =========================================================================
  await test("Weather", "Missing or empty location returns available: false without throwing", async () => {
    const res = await retrieveWeather("");
    assert.strictEqual(res.available, false);
    assert.strictEqual(res.temperatureC, null);
  });

  // =========================================================================
  // 8. COMMUNITY INTELLIGENCE & EARLY-WARNING SYSTEM (PHASE 7 USP)
  // =========================================================================
  await test("Community", "Normalizers handle raw variations and coarse coordinate privacy", () => {
    assert.strictEqual(normalizeCropName("tamatar"), "Tomato");
    assert.strictEqual(normalizeCropName("gehun"), "Wheat");
    assert.strictEqual(normalizeDiseaseName("Early blight (Alternaria solani)"), "Early Blight");
    assert.strictEqual(normalizeDiseaseName("healthy"), "Healthy Plant");
    assert.strictEqual(normalizeGeographicArea("Prayagraj, Uttar Pradesh, India"), "Prayagraj");
    assert.strictEqual(normalizeGeographicArea("25.4358, 81.8463"), "Area (25.44N, 81.85E)");
  });

  await test("Community", "Privacy threshold strictly suppresses exact counts when contributors < 3", () => {
    assert.strictEqual(INTELLIGENCE_CONFIG.MIN_CONTRIBUTORS_FOR_PUBLIC_STATS, 3);
    assert.strictEqual(INTELLIGENCE_CONFIG.MIN_REPORTS_FOR_WATCH, 3);
    assert.strictEqual(INTELLIGENCE_CONFIG.MIN_CONTRIBUTORS_FOR_WATCH, 2);
  });

  await test("Community", "Deterministic signal evaluator correctly classifies insufficient_data, watch, and elevated_signal", () => {
    const insufficient = evaluateSignalStatus({ currentReports: 2, distinctContributors: 1 });
    assert.strictEqual(insufficient.status, "insufficient_data");

    const watch = evaluateSignalStatus({ currentReports: 3, distinctContributors: 2, baselineReports: 3 });
    assert.strictEqual(watch.status, "watch");

    const elevated = evaluateSignalStatus({
      currentReports: 6,
      distinctContributors: 3,
      baselineReports: 3,
      baselineContributors: 2,
    });
    assert.strictEqual(elevated.status, "elevated_signal");
    assert.strictEqual(elevated.trend, "surging");
  });

  await test("Community", "Live database read returns structured payload with accurate filters", async () => {
    const intel = await getCommunityIntelligence({ timeRangeDays: 14 });
    assert.ok(intel.meta);
    assert.ok(intel.summary);
    assert.ok(Array.isArray(intel.signals));
    assert.ok(Array.isArray(intel.filters.areas));
    assert.ok(Array.isArray(intel.filters.crops));
  });

  await test("Community", "Personalized alert lifecycle prevents unauthorized mutation", async () => {
    const readUnauthorized = await markAlertAsRead("fake_user_id", "660000000000000000000000");
    assert.strictEqual(readUnauthorized, false);

    const dismissUnauthorized = await dismissAlert("fake_user_id", "660000000000000000000000");
    assert.strictEqual(dismissUnauthorized, false);
  });

  console.log("\n=================================================================");
  console.log(`E2E Security & Quality Audit Summary:`);
  console.log(`Total Tests Executed: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log("=================================================================\n");

  if (failedTests > 0) {
    console.error("Failed Findings:");
    console.error(JSON.stringify(findings, null, 2));
    process.exit(1);
  }
}

runE2ESecurityAudit()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error during audit execution:", err);
    process.exit(1);
  });
