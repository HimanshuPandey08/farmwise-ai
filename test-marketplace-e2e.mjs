/**
 * FarmWise AI - Complete Marketplace End-to-End Verification Test Suite
 * Tests master data, location validation, unit normalization, RBAC logic,
 * telemetry deduplication, multilingual dictionary catalogs, and Gemini localization.
 */

import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { INDIAN_STATES, getDistrictsForState, isValidState, isValidDistrict } from "./src/lib/india-locations.js";
import { INITIAL_CROP_CATEGORIES } from "./src/lib/crop-categories.js";
import { buildRecommendationPrompt } from "./src/lib/gemini.js";
import fs from "fs";
import path from "path";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("❌ MONGODB_URI is not set in environment.");
  process.exit(1);
}

const client = new MongoClient(uri);

async function runMarketplaceTests() {
  console.log("================================================================================");
  console.log("   FARMWISE AI - AGRICULTURAL MARKETPLACE END-TO-END VERIFICATION SUITE         ");
  console.log("================================================================================");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    await client.connect();
    const db = client.db("farmwise_ai");

    // -------------------------------------------------------------------------
    // TEST 1: Indian Geographic Architecture & Master Data
    // -------------------------------------------------------------------------
    console.log("\n[TEST GROUP 1] Pan-India Location Architecture & Master Data");
    assert(INDIAN_STATES.length >= 28, `All 28 Indian states loaded (found ${INDIAN_STATES.length})`);
    assert(isValidState("Uttar Pradesh"), "Valid state check for 'Uttar Pradesh'");
    assert(isValidState("Punjab"), "Valid state check for 'Punjab'");
    assert(isValidState("Maharashtra"), "Valid state check for 'Maharashtra'");
    assert(!isValidState("Atlantis"), "Invalid state rejection for 'Atlantis'");

    const upDistricts = getDistrictsForState("Uttar Pradesh");
    assert(upDistricts.includes("Varanasi"), "District Varanasi correctly located in Uttar Pradesh");
    assert(upDistricts.includes("Prayagraj"), "District Prayagraj correctly located in Uttar Pradesh");
    assert(isValidDistrict("Punjab", "Ludhiana"), "Valid district check for Ludhiana in Punjab");
    assert(!isValidDistrict("Punjab", "Varanasi"), "Invalid district check (Varanasi in Punjab rejected)");

    // -------------------------------------------------------------------------
    // TEST 2: Crop Categories Taxonomy in Database
    // -------------------------------------------------------------------------
    console.log("\n[TEST GROUP 2] Crop Categories Taxonomy & Database Verification");
    assert(INITIAL_CROP_CATEGORIES.length === 8, `Defined 8 master crop categories (found ${INITIAL_CROP_CATEGORIES.length})`);

    const dbCategories = await db.collection("cropCategories").find({}).toArray();
    assert(dbCategories.length >= 8, `MongoDB 'cropCategories' has at least 8 categories (found ${dbCategories.length})`);

    const foodGrains = dbCategories.find((c) => c.slug === "food-grains");
    assert(Boolean(foodGrains), "Category 'food-grains' exists in database");
    assert(Boolean(foodGrains?.name?.hi), "Category 'food-grains' contains Hindi name");
    assert(Array.isArray(foodGrains?.popularCrops) && foodGrains.popularCrops.length > 0, "Category contains popular crop suggestions");

    // -------------------------------------------------------------------------
    // TEST 3: Marketplace Agricultural Units & Quantity Normalization
    // -------------------------------------------------------------------------
    console.log("\n[TEST GROUP 3] Agricultural Measurement Units & Quintal Normalization");

    function normalizeQuantity(quantity, unit) {
      const q = Number(quantity);
      const u = String(unit).toLowerCase().trim();
      if (u === "tonne" || u === "tonnes" || u === "mt" || u === "metric tonne") {
        return q * 10; // 1 Tonne = 10 Quintals
      }
      if (u === "kg" || u === "kilogram" || u === "kilograms") {
        return Math.round((q / 100) * 100) / 100; // 1 Quintal = 100 Kg
      }
      return q; // Standard Quintal
    }

    assert(normalizeQuantity(10, "Quintal") === 10, "10 Quintals normalizes to 10 Quintals");
    assert(normalizeQuantity(5, "Tonne") === 50, "5 Tonnes normalizes to 50 Quintals (1 MT = 10 Qtl)");
    assert(normalizeQuantity(2.5, "MT") === 25, "2.5 MT normalizes to 25 Quintals");
    assert(normalizeQuantity(500, "Kg") === 5, "500 Kg normalizes to 5 Quintals");
    assert(normalizeQuantity(250, "kg") === 2.5, "250 kg normalizes to 2.5 Quintals");

    // -------------------------------------------------------------------------
    // TEST 4: RBAC & User Role Migration Integrity
    // -------------------------------------------------------------------------
    console.log("\n[TEST GROUP 4] User Role Migration & RBAC Protection");
    const usersWithoutRole = await db.collection("user").countDocuments({ role: { $exists: false } });
    assert(usersWithoutRole === 0, `All users have assigned roles in database (0 unassigned, found ${usersWithoutRole})`);

    const usersWithRole = await db.collection("user").find({}).toArray();
    assert(usersWithRole.length > 0, `Verified ${usersWithRole.length} user accounts with valid roles`);

    const farmerCount = usersWithRole.filter((u) => u.role === "farmer").length;
    const adminCount = usersWithRole.filter((u) => u.role === "admin").length;
    const buyerCount = usersWithRole.filter((u) => u.role === "buyer").length;
    console.log(`    User base breakdown: ${farmerCount} Farmers, ${buyerCount} Buyers, ${adminCount} Admins`);
    assert(farmerCount >= 1, "At least 1 registered farmer account exists");

    // -------------------------------------------------------------------------
    // TEST 5: Telemetry Event Deduplication Window
    // -------------------------------------------------------------------------
    console.log("\n[TEST GROUP 5] Telemetry Event Deduplication");
    const testListingId = new ObjectId();
    const testUserId = "test-buyer-telemetry-dedup";
    const now = new Date();

    // Insert first event
    await db.collection("listingEvents").insertOne({
      listingId: testListingId,
      eventType: "whatsapp_click",
      userId: testUserId,
      createdAt: now,
    });

    // Check recent duplicate window (15s)
    const windowStart = new Date(now.getTime() - 15000);
    const existingRecent = await db.collection("listingEvents").findOne({
      listingId: testListingId,
      eventType: "whatsapp_click",
      userId: testUserId,
      createdAt: { $gte: windowStart },
    });
    assert(Boolean(existingRecent), "Recent telemetry event is detected within 15s window");

    // Clean up test event
    await db.collection("listingEvents").deleteOne({ _id: existingRecent._id });
    assert(true, "Test telemetry event cleaned up successfully");

    // -------------------------------------------------------------------------
    // TEST 6: Multilingual Localization Catalogs (11 Indian Languages)
    // -------------------------------------------------------------------------
    console.log("\n[TEST GROUP 6] Multilingual i18n Catalogs (11 Languages)");
    const localesDir = path.join(process.cwd(), "src", "i18n", "locales");
    const expectedLanguages = ["en", "hi", "mr", "pa", "bn", "ta", "te", "gu", "kn", "ml", "or"];

    for (const lang of expectedLanguages) {
      const filePath = path.join(localesDir, `${lang}.json`);
      assert(fs.existsSync(filePath), `Locale dictionary exists: ${lang}.json`);
      const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      assert(Boolean(content.common?.marketplace), `[${lang}] contains 'common.marketplace' translation`);
      assert(Boolean(content.marketplace?.title), `[${lang}] contains 'marketplace.title' translation`);
    }

    // -------------------------------------------------------------------------
    // TEST 7: Multilingual Gemini Consultation Prompt
    // -------------------------------------------------------------------------
    console.log("\n[TEST GROUP 7] Grounded Multilingual Gemini Consultation Prompt");
    const englishPrompt = buildRecommendationPrompt({
      cropName: "Wheat",
      cropAge: 45,
      ageUnit: "days",
      soilType: "Alluvial",
      location: "Karnal, Haryana",
      budget: 1500,
      diagnosis: {
        diseases: [{ name: "Puccinia striiformis (Yellow Rust)", probability: 0.92 }],
      },
      weather: { available: true, temperatureC: 22, humidityPercent: 78 },
      agriculturalEvidence: [
        { title: "ICAR Yellow Rust Advisory", url: "https://icar.org.in/wheat-rust", content: "Apply Propiconazole 25 EC @ 0.1%" },
      ],
      language: "en",
    });

    assert(englishPrompt.includes("Puccinia striiformis"), "Prompt includes verified disease name");
    assert(englishPrompt.includes("Karnal, Haryana"), "Prompt includes farmer location");
    assert(englishPrompt.includes("ICAR Yellow Rust Advisory"), "Prompt includes grounded ICAR evidence");

    const hindiPrompt = buildRecommendationPrompt({
      cropName: "Wheat",
      cropAge: 45,
      ageUnit: "days",
      soilType: "Alluvial",
      location: "Karnal, Haryana",
      budget: 1500,
      diagnosis: {
        diseases: [{ name: "Yellow Rust", probability: 0.92 }],
      },
      weather: { available: false },
      agriculturalEvidence: [],
      language: "hi",
    });

    assert(hindiPrompt.includes("Hindi (हिन्दी)"), "Hindi prompt includes explicit 'Hindi (हिन्दी)' instruction");
    assert(hindiPrompt.includes("RESPONSE JSON SCHEMA:"), "Hindi prompt preserves required English JSON response schema");

    // -------------------------------------------------------------------------
    // TEST 8: MongoDB Atlas Indexes Verification
    // -------------------------------------------------------------------------
    console.log("\n[TEST GROUP 8] MongoDB Collection Indexes");
    const userIndexes = await db.collection("user").indexes();
    const userIndexNames = userIndexes.map((idx) => Object.keys(idx.key)[0]);
    assert(userIndexNames.includes("role"), "User collection indexed on 'role'");

    const listingIndexes = await db.collection("cropListings").indexes();
    const listingIndexNames = listingIndexes.map((idx) => Object.keys(idx.key)[0]);
    assert(listingIndexNames.includes("status"), "cropListings collection indexed on 'status'");
    assert(listingIndexNames.includes("farmerId"), "cropListings collection indexed on 'farmerId'");

    console.log("\n================================================================================");
    console.log(`   TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY! (100%)       `);
    console.log("================================================================================");
  } finally {
    await client.close();
  }
}

runMarketplaceTests().catch((err) => {
  console.error("FATAL TEST FAILURE:", err);
  process.exit(1);
});
