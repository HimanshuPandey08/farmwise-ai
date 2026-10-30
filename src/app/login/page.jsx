"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import AuthSideBanner from "@/components/AuthSideBanner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [successNotice, setSuccessNotice] = useState(() => {
    if (searchParams.get("registered")) {
      const role = searchParams.get("role");
      return role === "buyer"
        ? "Buyer account registered successfully! Please sign in below."
        : "Farmer account registered successfully! Please sign in below.";
    }
    return "";
  });
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setMessage("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setMessage("Please enter your email address.");
      return;
    }

    if (!password) {
      setMessage("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await authClient.signIn.email({
        email: trimmedEmail,
        password,
      });

      if (error) {
        setMessage(error.message || "Invalid email or password. Please try again.");
        return;
      }

      // Check redirect URL parameter if provided
      const redirectParam = searchParams.get("redirect");
      if (redirectParam && redirectParam.startsWith("/")) {
        router.push(redirectParam);
        router.refresh();
        return;
      }

      // Role-based post-login redirection
      const { data: session } = await authClient.getSession();
      const role = (session?.user?.role || "farmer").toLowerCase();

      if (role === "admin") {
        router.push("/admin/marketplace");
      } else if (role === "buyer") {
        router.push("/marketplace");
      } else {
        // Farmer default: go to marketplace dashboard
        router.push("/marketplace/dashboard");
      }
      router.refresh();
    } catch {
      setMessage("An unexpected error occurred. Please verify your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
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
      <div className="rounded-2xl border border-gray-200/90 bg-white p-7 sm:p-9 shadow-sm sm:shadow">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
            Welcome back
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
            Sign in to access your crop produce marketplace, farm dashboard, and agricultural advisories.
          </p>
        </div>

        {/* Registration Success Banner */}
        {successNotice && (
          <div
            role="status"
            className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800"
          >
            <span className="text-sm shrink-0" aria-hidden="true">
              ✅
            </span>
            <span className="leading-relaxed font-medium">{successNotice}</span>
          </div>
        )}

        {/* Error / Feedback Alert */}
        {message && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800"
          >
            <span className="text-sm shrink-0" aria-hidden="true">
              ⚠️
            </span>
            <span className="leading-relaxed font-medium">{message}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} noValidate className="space-y-4 sm:space-y-5">
          {/* Email Field */}
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
            >
              Email address
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              disabled={loading}
              className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/30 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700"
              >
                Password
              </label>
            </div>
            <div className="relative">
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
                className="w-full rounded-xl border border-gray-300 bg-white pl-3.5 pr-11 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/30 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-800 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Navigation to Register */}
        <div className="mt-6 border-t border-gray-100 pt-5 text-center text-xs sm:text-sm text-gray-600">
          <span>Don&apos;t have an account? </span>
          <Link
            href="/register"
            className="font-semibold text-green-800 hover:text-green-950 underline underline-offset-2 transition"
          >
            Create an account
          </Link>
        </div>
      </div>

      {/* Back to Home link */}
      <div className="mt-6 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition"
        >
          <span>←</span>
          <span>Back to FarmWise AI Home</span>
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center lg:grid lg:grid-cols-12 overflow-x-hidden">
      {/* Left Column: Branding and Benefits (Desktop) */}
      <AuthSideBanner />

      {/* Right Column: Authentication Card with Suspense for useSearchParams */}
      <main className="flex-1 lg:col-span-7 xl:col-span-7 flex flex-col justify-center px-4 py-10 sm:px-8 md:px-12 lg:px-16 xl:px-20">
        <Suspense fallback={<div className="text-center py-10 text-gray-500">Loading sign-in...</div>}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
