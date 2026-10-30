import assert from "node:assert";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

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

import { db } from "./src/lib/mongodb.js";

async function runCommunityIntelligenceTests() {
  console.log("Starting Community Disease Intelligence unit tests...\n");

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      passed++;
      console.log(`PASS: ${name}`);
    } catch (err) {
      console.error(`FAIL: ${name}`);
      console.error(err);
    }
  }

  // 1. Normalization: Crop names
  await test("1. normalizeCropName handles synonyms, variants, and null", () => {
    assert.strictEqual(normalizeCropName(null), "Unknown Crop");
    assert.strictEqual(normalizeCropName(""), "Unknown Crop");
    assert.strictEqual(normalizeCropName("wheat"), "Wheat");
    assert.strictEqual(normalizeCropName("gehun"), "Wheat");
    assert.strictEqual(normalizeCropName("tamatar"), "Tomato");
    assert.strictEqual(normalizeCropName("aloo"), "Potato");
    assert.strictEqual(normalizeCropName("paddy"), "Rice (Paddy)");
    assert.strictEqual(normalizeCropName("dhan"), "Rice (Paddy)");
    assert.strictEqual(normalizeCropName("corn"), "Maize");
    assert.strictEqual(normalizeCropName("kaddu"), "Pumpkin");
    assert.strictEqual(normalizeCropName("capsicum"), "Capsicum");
  });

  // 2. Normalization: Disease names
  await test("2. normalizeDiseaseName removes binomial taxonomy and identifies healthy status", () => {
    assert.strictEqual(normalizeDiseaseName(null), null);
    assert.strictEqual(normalizeDiseaseName("healthy"), "Healthy Plant");
    assert.strictEqual(normalizeDiseaseName("no disease detected"), "Healthy Plant");
    assert.strictEqual(
      normalizeDiseaseName("Early blight (Alternaria solani)"),
      "Early Blight"
    );
    assert.strictEqual(
      normalizeDiseaseName("Late blight (Phytophthora infestans)"),
      "Late Blight"
    );
    assert.strictEqual(
      normalizeDiseaseName("Yellow rust (Puccinia striiformis)"),
      "Yellow (Stripe) Rust"
    );
    assert.strictEqual(
      normalizeDiseaseName("Powdery mildew"),
      "Powdery Mildew"
    );
  });

  // 3. Normalization: Geographic Area
  await test("3. normalizeGeographicArea coarsens locations, strips noise and formats coordinates", () => {
    assert.strictEqual(normalizeGeographicArea(null), null);
    assert.strictEqual(normalizeGeographicArea(""), null);
    assert.strictEqual(
      normalizeGeographicArea("Prayagraj, Uttar Pradesh, India"),
      "Prayagraj"
    );
    assert.strictEqual(normalizeGeographicArea("Mathura-UP"), "Mathura");
    assert.strictEqual(normalizeGeographicArea(" deoria "), "Deoria");
    assert.strictEqual(
      normalizeGeographicArea("25.4358, 81.8463"),
      "Area (25.44N, 81.85E)"
    );
  });

  // 4. Deterministic signal evaluation: Insufficient data
  await test("4. evaluateSignalStatus returns insufficient_data when below minimum contributors or reports", () => {
    // 2 reports from 1 farmer
    const res1 = evaluateSignalStatus({
      currentReports: 2,
      distinctContributors: 1,
      baselineReports: 0,
      baselineContributors: 0,
    });
    assert.strictEqual(res1.status, "insufficient_data");
    assert.strictEqual(res1.evidenceLevel, "low");

    // 4 reports but all from the SAME farmer
    const res2 = evaluateSignalStatus({
      currentReports: 4,
      distinctContributors: 1,
      baselineReports: 0,
      baselineContributors: 0,
    });
    assert.strictEqual(res2.status, "insufficient_data");
    assert.strictEqual(res2.evidenceLevel, "low");
  });

  // 5. Deterministic signal evaluation: Watch vs Elevated Signal
  await test("5. evaluateSignalStatus correctly classifies watch and surging elevated signals", () => {
    // Watch: 3 reports from 2 farmers (no surge)
    const watchRes = evaluateSignalStatus({
      currentReports: 3,
      distinctContributors: 2,
      baselineReports: 3,
      baselineContributors: 2,
    });
    assert.strictEqual(watchRes.status, "watch");
    assert.strictEqual(watchRes.evidenceLevel, "moderate");

    // Elevated: 6 reports from 3 farmers with a 2x surge over baseline (3 reports)
    const elevatedRes = evaluateSignalStatus({
      currentReports: 6,
      distinctContributors: 3,
      baselineReports: 3,
      baselineContributors: 2,
    });
    assert.strictEqual(elevatedRes.status, "elevated_signal");
    assert.strictEqual(elevatedRes.evidenceLevel, "high");
    assert.strictEqual(elevatedRes.trend, "surging");
    assert.ok(elevatedRes.explanation.includes("Elevated disease signal"));
  });

  // 6. Privacy threshold suppresses exact counts and returns responsible agronomic advice
  await test("6. Privacy threshold suppresses exact counts and returns responsible agronomic advice", () => {
    const advice = getRecommendedAction("Yellow (Stripe) Rust", "Wheat");
    assert.ok(advice.preventativeAction.length > 0);
    assert.ok(advice.scoutingAdvice.length > 0);
    assert.ok(advice.disclaimer.includes("Krishi Vigyan Kendra"));

    // Verify constant configuration integrity
    assert.strictEqual(INTELLIGENCE_CONFIG.MIN_CONTRIBUTORS_FOR_PUBLIC_STATS, 3);
    assert.strictEqual(INTELLIGENCE_CONFIG.MIN_CONTRIBUTORS_FOR_WATCH, 2);
    assert.strictEqual(INTELLIGENCE_CONFIG.MIN_REPORTS_FOR_WATCH, 3);
  });

  // 7. Live MongoDB Community Intelligence read
  await test("7. Live MongoDB query returns valid community intelligence structure", async () => {
    const result = await getCommunityIntelligence({ timeRangeDays: 30 });

    assert.ok(result);
    assert.ok(result.meta);
    assert.strictEqual(result.meta.timeRangeDays, 30);
    assert.ok(result.summary);
    assert.strictEqual(typeof result.summary.totalEligibleReports, "number");
    assert.strictEqual(typeof result.summary.distinctAreasCount, "number");
    assert.strictEqual(typeof result.summary.activeSignalsCount, "number");
    assert.ok(Array.isArray(result.signals));
    assert.ok(Array.isArray(result.filters.areas));
    assert.ok(Array.isArray(result.filters.crops));

    // Confirm signals have required fields
    for (const signal of result.signals) {
      assert.ok(signal.id);
      assert.ok(signal.area);
      assert.ok(signal.crop);
      assert.ok(signal.disease);
      assert.ok(["elevated_signal", "watch", "insufficient_data"].includes(signal.status));
      assert.ok(["high", "moderate", "low"].includes(signal.evidenceLevel));
      assert.ok(signal.contributorCountDisplay);
    }
  });

  // 8. User agronomic profile derivation & alert lifecycle
  await test("8. getUserAgronomicProfile and alert lifecycle operate safely", async () => {
    // Test with non-existent or fresh user ID
    const profile = await getUserAgronomicProfile("test_user_profile_check");
    assert.ok(Array.isArray(profile.areas));
    assert.ok(Array.isArray(profile.crops));

    // Check refreshUserAlerts handles user with no alerts gracefully
    const alerts = await refreshUserAlerts("test_user_profile_check");
    assert.ok(Array.isArray(alerts));

    // Check markAlertAsRead and dismissAlert handle invalid ID without throwing
    const readResult = await markAlertAsRead("test_user_profile_check", "invalid_alert_id");
    assert.strictEqual(readResult, false);

    const dismissResult = await dismissAlert("test_user_profile_check", "invalid_alert_id");
    assert.strictEqual(dismissResult, false);
  });

  console.log(`\n========================================`);
  console.log(`Community Intelligence Test Results: ${passed}/${total} passed`);
  console.log(`========================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runCommunityIntelligenceTests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Fatal error during test execution:", err);
    process.exit(1);
  });
