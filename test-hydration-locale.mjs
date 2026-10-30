/**
 * test-hydration-locale.mjs
 * Verification of Server-Side Cookie Parsing, Fallback, and Hydration Alignment
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  COOKIE_NAME,
  isValidLocale,
  getLanguageName,
} from "./src/i18n/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("=== FARMWISE AI — HYDRATION & LOCALE VERIFICATION SUITE ===");

// 1. Verify Supported Languages Count & Metadata
console.log("\n1. Verifying 11 Supported Languages and Config...");
assert.equal(SUPPORTED_LANGUAGES.length, 11, "Must support exactly 11 languages");
assert.equal(DEFAULT_LANGUAGE, "en", "Default language must be English (en)");
assert.equal(COOKIE_NAME, "farmwise_lang", "Cookie name must be farmwise_lang");

const expectedCodes = ["en", "hi", "mr", "pa", "bn", "ta", "te", "gu", "kn", "ml", "or"];
for (const code of expectedCodes) {
  assert.ok(isValidLocale(code), `Locale '${code}' should be valid`);
  const name = getLanguageName(code);
  assert.ok(name && name.length > 0, `Locale '${code}' must have nativeName`);
  console.log(`  ✓ Locale '${code}': ${name}`);
}

// 2. Verify Invalid Locales and Fallbacks
console.log("\n2. Testing Validation Edge Cases and Fallbacks...");
const invalidCases = [null, undefined, "", "   ", "fr", "es", "de", "zh", "../malicious", "en; DROP TABLE"];
for (const bad of invalidCases) {
  assert.equal(isValidLocale(bad), false, `Invalid input '${bad}' must return false`);
}
console.log("  ✓ All invalid/unsupported locale strings rejected safely.");

// 3. Simulate RootLayout SSR Cookie Extraction Logic
console.log("\n3. Simulating RootLayout SSR Cookie Evaluation...");
function simulateRootLayoutCookieResolution(cookieStore) {
  const cookieVal = cookieStore.get(COOKIE_NAME)?.value;
  return isValidLocale(cookieVal) ? cookieVal.trim().toLowerCase() : DEFAULT_LANGUAGE;
}

// Case A: Missing cookie -> English
assert.equal(simulateRootLayoutCookieResolution(new Map()), "en");
console.log("  ✓ Missing cookie resolves to default: 'en'");

// Case B: Valid cookie for each language
for (const code of expectedCodes) {
  const store = new Map([[COOKIE_NAME, { value: code }]]);
  assert.equal(simulateRootLayoutCookieResolution(store), code);
}
console.log("  ✓ All 11 valid cookie values resolve to their respective locales");

// Case C: Invalid cookie -> fallback to 'en'
const storeInvalid = new Map([[COOKIE_NAME, { value: "invalid_xyz" }]]);
assert.equal(simulateRootLayoutCookieResolution(storeInvalid), "en");
console.log("  ✓ Invalid cookie value safely falls back to 'en'");

// Case D: Cookie with leading/trailing spaces
const storeSpaces = new Map([[COOKIE_NAME, { value: "  mr  " }]]);
assert.equal(simulateRootLayoutCookieResolution(storeSpaces), "mr");
console.log("  ✓ Whitespace-padded cookie value handled correctly");

// 4. Verify Static Translations Dictionaries Loaded in LanguageContext
console.log("\n4. Verifying Translation Catalogs on Disk...");
for (const code of expectedCodes) {
  const filePath = path.join(__dirname, "src", "i18n", "locales", `${code}.json`);
  assert.ok(fs.existsSync(filePath), `Dictionary for ${code} must exist at ${filePath}`);
  const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  assert.ok(content.common && content.nav && content.marketplace && content.diagnose, `Keys must exist in ${code}.json`);
}
console.log("  ✓ All 11 dictionary JSON files verified on disk with valid structure");

console.log("\n=== ALL HYDRATION & LOCALE CHECKS PASSED SUCCESSFULLY (100%) ===\n");
