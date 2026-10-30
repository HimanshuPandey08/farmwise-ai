"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import AuthSideBanner from "@/components/AuthSideBanner";

const BUYER_CATEGORIES = [
  { value: "wholesaler", label: "Wholesaler / Mandi Trader" },
  { value: "retailer", label: "Retailer / Supermarket" },
  { value: "processor", label: "Food Processing / Mill" },
  { value: "manufacturer", label: "Food Manufacturer" },
  { value: "exporter", label: "Agri-Produce Exporter" },
  { value: "hospitality", label: "Restaurant / Hotel / Caterer" },
  { value: "fpo_buyer", label: "Cooperative / Institutional Buyer" },
  { value: "other", label: "Other Bulk Buyer" }
];

export default function RegisterPage() {
  const router = useRouter();

  // Role: "farmer" | "buyer"
  const [role, setRole] = useState("farmer");

  // Common fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Buyer specific fields
  const [businessName, setBusinessName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("wholesaler");
  const [gstin, setGstin] = useState("");

  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  function validateForm() {
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      return "Please enter your full name (at least 2 characters).";
    }

    const trimmedPhone = phone.trim().replace(/\D/g, "");
    if (!trimmedPhone || trimmedPhone.length !== 10) {
      return "Please enter a valid 10-digit Indian mobile number.";
    }

    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      return "Please enter a valid email address.";
    }

    if (role === "buyer") {
      const trimmedBusiness = businessName.trim();
      if (!trimmedBusiness || trimmedBusiness.length < 2) {
        return "Please enter your business or company name.";
      }

      if (gstin.trim()) {
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstinRegex.test(gstin.trim().toUpperCase())) {
          return "Please enter a valid 15-character Indian GSTIN or leave it blank.";
        }
      }
    }

    if (!password || password.length < 8) {
      return "Password must be at least 8 characters long.";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match. Please re-enter.";
    }

    return null;
  }

  async function handleRegister(e) {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    const validationError = validateForm();
    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }

    setLoading(true);

    try {
      const { error } = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        phone: phone.trim().replace(/\D/g, ""),
        businessName: role === "buyer" ? businessName.trim() : undefined,
        businessCategory: role === "buyer" ? businessCategory : undefined,
        gstin: role === "buyer" && gstin.trim() ? gstin.trim().toUpperCase() : undefined,
      });

      if (error) {
        setMessage({
          type: "error",
          text: error.message || "Registration failed. An account with this email may already exist.",
        });
        return;
      }

      setMessage({
        type: "success",
        text: `Account created successfully as a ${role === "farmer" ? "Farmer" : "Buyer"}! Redirecting to sign in...`,
      });

      setTimeout(() => {
        router.push(`/login?registered=1&role=${encodeURIComponent(role)}`);
      }, 1500);
    } catch {
      setMessage({
        type: "error",
        text: "An unexpected error occurred. Please verify your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center lg:grid lg:grid-cols-12 overflow-x-hidden">
      {/* Left Column: Branding and Benefits (Desktop) */}
      <AuthSideBanner />

      {/* Right Column: Registration Card */}
      <main className="flex-1 lg:col-span-7 xl:col-span-7 flex flex-col justify-center px-4 py-10 sm:px-8 md:px-12 lg:px-16 xl:px-20">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile-only Branding Header */}
          <div className="mb-8 lg:hidden text-center sm:text-left">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 transition hover:opacity-90"
              aria-label="FarmWise AI Home"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-900 text-2xl text-lime-400 shadow-sm">
                🌱
              </span>
              <div className="text-left">
                <span className="text-xl font-bold tracking-tight text-gray-950 block">
                  FarmWise AI
                </span>
                <span className="text-[11px] font-medium text-green-800 block -mt-0.5">
                  Agricultural Produce Marketplace
                </span>
              </div>
            </Link>
          </div>

          {/* Card Container */}
          <div className="rounded-2xl border border-gray-200/90 bg-white p-6 sm:p-8 shadow-sm sm:shadow">
            {/* Header */}
            <div className="mb-5">
              <h1 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
                Join FarmWise
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-600 leading-relaxed">
                Choose how you want to use the platform: sell your harvested crops or buy produce in bulk.
              </p>
            </div>

            {/* Role Selection Tabs */}
            <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setRole("farmer")}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition ${
                  role === "farmer"
                    ? "bg-white text-green-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-950"
                }`}
              >
                <span>🌾</span>
                <span>I am a Farmer</span>
              </button>

              <button
                type="button"
                onClick={() => setRole("buyer")}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition ${
                  role === "buyer"
                    ? "bg-white text-emerald-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-950"
                }`}
              >
                <span>🏢</span>
                <span>I am a Bulk Buyer</span>
              </button>
            </div>

            {/* Role Explanatory Callout */}
            <div className="mb-5 rounded-xl border border-gray-100 bg-gray-50/80 px-3.5 py-2.5 text-xs text-gray-700">
              {role === "farmer" ? (
                <p>
                  <strong className="text-green-800 font-semibold">Farmer Account:</strong> List harvested crops, connect with verified bulk buyers across India, and use AI disease diagnosis.
                </p>
              ) : (
                <p>
                  <strong className="text-emerald-800 font-semibold">Buyer Account:</strong> Discover fresh harvests directly from farmers, filter by quality and district, and contact growers directly.
                </p>
              )}
            </div>

            {/* Error or Success Alert */}
            {message.text && (
              <div
                role={message.type === "error" ? "alert" : "status"}
                aria-live="polite"
                className={`mb-5 flex items-start gap-2.5 rounded-xl border p-3.5 text-xs ${
                  message.type === "error"
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800"
                }`}
              >
                <span className="text-sm shrink-0" aria-hidden="true">
                  {message.type === "error" ? "⚠️" : "✅"}
                </span>
                <span className="leading-relaxed font-medium">{message.text}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleRegister} noValidate className="space-y-4">
              {/* Full Name Field */}
              <div>
                <label
                  htmlFor="register-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
                >
                  {role === "farmer" ? "Full Name" : "Contact Person Name"}
                </label>
                <input
                  id="register-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === "farmer" ? "e.g. Ramesh Patel" : "e.g. Rajesh Sharma"}
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/30 transition disabled:bg-gray-100"
                />
              </div>

              {/* Buyer Business Details */}
              {role === "buyer" && (
                <>
                  <div>
                    <label
                      htmlFor="register-business-name"
                      className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
                    >
                      Business / Company Name
                    </label>
                    <input
                      id="register-business-name"
                      name="businessName"
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Kisan Agri Traders Pvt Ltd"
                      disabled={loading}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/30 transition disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="register-business-category"
                      className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
                    >
                      Business Category
                    </label>
                    <select
                      id="register-business-category"
                      name="businessCategory"
                      value={businessCategory}
                      onChange={(e) => setBusinessCategory(e.target.value)}
                      disabled={loading}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/30 transition disabled:bg-gray-100"
                    >
                      {BUYER_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Mobile Number Field */}
              <div>
                <label
                  htmlFor="register-phone"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
                >
                  Mobile Number (for buyer/seller contact)
                </label>
                <div className="relative flex rounded-xl border border-gray-300 bg-white focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-600/30">
                  <span className="inline-flex items-center pl-3.5 pr-2 text-xs font-bold text-gray-500">
                    +91
                  </span>
                  <input
                    id="register-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    maxLength={10}
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="9876543210"
                    disabled={loading}
                    className="w-full rounded-r-xl bg-transparent py-2 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:bg-gray-100"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label
                  htmlFor="register-email"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/30 transition disabled:bg-gray-100"
                />
              </div>

              {/* Optional GSTIN for Buyer */}
              {role === "buyer" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="register-gstin"
                      className="block text-xs font-semibold uppercase tracking-wider text-gray-700"
                    >
                      GSTIN (Optional)
                    </label>
                    <span className="text-[10px] text-gray-500 font-medium">
                      Commercial trade verification
                    </span>
                  </div>
                  <input
                    id="register-gstin"
                    name="gstin"
                    type="text"
                    maxLength={15}
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="22AAAAA0000A1Z5"
                    disabled={loading}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 uppercase placeholder:text-gray-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/30 transition disabled:bg-gray-100"
                  />
                </div>
              )}

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="register-password"
                    className="block text-xs font-semibold uppercase tracking-wider text-gray-700"
                  >
                    Password
                  </label>
                  <span className="text-[10px] text-gray-500 font-medium">
                    Min. 8 characters
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="register-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a secure password"
                    disabled={loading}
                    className="w-full rounded-xl border border-gray-300 bg-white pl-3.5 pr-11 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/30 transition disabled:bg-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label
                  htmlFor="register-confirm-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
                >
                  Confirm Password
                </label>
                <input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/30 transition disabled:bg-gray-100"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-green-800 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span>Creating your {role === "farmer" ? "Farmer" : "Buyer"} account...</span>
                ) : (
                  <span>Register as {role === "farmer" ? "Farmer" : "Bulk Buyer"}</span>
                )}
              </button>
            </form>

            {/* Navigation to Login */}
            <div className="mt-5 border-t border-gray-100 pt-4 text-center text-xs sm:text-sm text-gray-600">
              <span>Already have an account? </span>
              <Link
                href="/login"
                className="font-semibold text-green-800 hover:text-green-950 underline underline-offset-2 transition"
              >
                Sign in
              </Link>
            </div>
          </div>

          {/* Back to Home link */}
          <div className="mt-5 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition"
            >
              <span>←</span>
              <span>Back to FarmWise AI Home</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
