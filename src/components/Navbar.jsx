"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import LanguageSelector from "@/components/LanguageSelector";
import LogoutButton from "@/components/LogoutButton";
import { useLanguage } from "@/context/LanguageContext";

export default function Navbar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const [session, setSession] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkAuth() {
      try {
        const { data } = await authClient.getSession();
        if (active && data) {
          setSession(data);

          // Fetch unread notifications count
          fetch("/api/marketplace/notifications")
            .then((r) => r.json())
            .then((d) => {
              if (active && d && Number.isFinite(d.unreadCount)) {
                setUnreadNotifications(d.unreadCount);
              }
            })
            .catch(() => {});
        }
      } catch {
        // Visitor
      }
    }

    checkAuth();

    return () => {
      active = false;
    };
  }, [pathname]);

  const role = (session?.user?.role || "guest").toLowerCase();
  const isAuthenticated = Boolean(session && session.user);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-[66px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5 transition hover:opacity-90">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-900 text-2xl text-lime-400 shadow-sm">
            🌱
          </span>
          <div>
            <span className="text-lg font-bold tracking-tight text-gray-950 block leading-tight">
              FarmWise AI
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-green-700 block -mt-0.5">
              Agricultural Marketplace
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-5 text-xs font-semibold text-gray-700 lg:flex xl:gap-6">
          <Link
            href="/"
            className={`transition hover:text-green-700 ${pathname === "/" ? "text-green-800 font-bold" : ""}`}
          >
            {t("common.home", "Home")}
          </Link>

          <Link
            href="/marketplace"
            className={`transition hover:text-green-700 ${pathname.startsWith("/marketplace") && !pathname.includes("/dashboard") && !pathname.includes("/sell") ? "text-green-800 font-bold" : ""}`}
          >
            {t("common.marketplace", "Marketplace")}
          </Link>

          <Link
            href="/marketplace/crops"
            className={`transition hover:text-green-700 ${pathname === "/marketplace/crops" ? "text-green-800 font-bold" : ""}`}
          >
            {t("common.buyCrops", "Buy Crops")}
          </Link>

          {/* Sell Crops button */}
          <Link
            href={isAuthenticated && role === "buyer" ? "/marketplace/crops" : "/marketplace/sell"}
            className="inline-flex items-center gap-1 rounded-lg bg-lime-400 px-3 py-1.5 text-xs font-bold text-gray-950 shadow-xs transition hover:bg-lime-300"
          >
            <span>➕</span>
            <span>{t("common.sellCrops", "Sell Crops")}</span>
          </Link>

          <Link
            href="/diagnose"
            className={`transition hover:text-green-700 ${pathname.startsWith("/diagnose") ? "text-green-800 font-bold" : ""}`}
          >
            {t("common.diagnose", "Diagnose")}
          </Link>

          <Link
            href="/community-intelligence"
            className={`transition hover:text-green-700 ${pathname.startsWith("/community-intelligence") ? "text-green-800 font-bold" : ""}`}
          >
            {t("common.community", "Community")}
          </Link>

          {/* Role specific links */}
          {isAuthenticated && (
            <>
              <Link
                href="/marketplace/dashboard"
                className={`transition hover:text-green-700 ${pathname === "/marketplace/dashboard" ? "text-green-800 font-bold" : ""}`}
              >
                {t("common.dashboard", "Dashboard")}
              </Link>

              {role === "farmer" && (
                <Link
                  href="/marketplace/my-listings"
                  className={`transition hover:text-green-700 ${pathname === "/marketplace/my-listings" ? "text-green-800 font-bold" : ""}`}
                >
                  {t("common.myListings", "My Listings")}
                </Link>
              )}

              {role === "buyer" && (
                <Link
                  href="/marketplace/saved"
                  className={`transition hover:text-green-700 ${pathname === "/marketplace/saved" ? "text-green-800 font-bold" : ""}`}
                >
                  {t("common.saved", "Saved Produce")}
                </Link>
              )}

              {role === "admin" && (
                <Link
                  href="/admin/marketplace"
                  className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900 transition hover:bg-amber-200"
                >
                  ⚙️ {t("common.admin", "Admin")}
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Right Section: Language Selector, Notifications, Auth */}
        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <LanguageSelector />

          {/* Notifications Icon (Authenticated) */}
          {isAuthenticated && (
            <Link
              href="/marketplace/notifications"
              className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 hover:text-green-800"
              aria-label="Notifications"
            >
              <span className="text-sm">🔔</span>
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              )}
            </Link>
          )}

          {/* User Status / Auth Buttons */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="hidden rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 sm:inline-block"
              >
                👤 {session.user.name?.split(" ")[0] || "Profile"}
              </Link>
              <LogoutButton className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-200" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:text-green-800"
              >
                {t("common.login", "Sign In")}
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-green-800 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-green-900"
              >
                {t("common.register", "Register")}
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 lg:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col space-y-2 text-sm font-semibold text-gray-800">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-green-700"
            >
              {t("common.home", "Home")}
            </Link>
            <Link
              href="/marketplace"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-green-700"
            >
              {t("common.marketplace", "Marketplace")}
            </Link>
            <Link
              href="/marketplace/crops"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-green-700"
            >
              {t("common.buyCrops", "Buy Crops")}
            </Link>
            <Link
              href={isAuthenticated && role === "buyer" ? "/marketplace/crops" : "/marketplace/sell"}
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-green-800 font-bold hover:text-green-900"
            >
              ➕ {t("common.sellCrops", "Sell Crops")}
            </Link>
            <Link
              href="/diagnose"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-green-700"
            >
              {t("common.diagnose", "Diagnose Crop")}
            </Link>
            <Link
              href="/community-intelligence"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-green-700"
            >
              {t("common.community", "Community Intelligence")}
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  href="/marketplace/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1.5 hover:text-green-700"
                >
                  {t("common.dashboard", "Dashboard")}
                </Link>
                {role === "farmer" && (
                  <Link
                    href="/marketplace/my-listings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-1.5 hover:text-green-700"
                  >
                    {t("common.myListings", "My Produce Listings")}
                  </Link>
                )}
                {role === "buyer" && (
                  <Link
                    href="/marketplace/saved"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-1.5 hover:text-green-700"
                  >
                    {t("common.saved", "Saved Produce")}
                  </Link>
                )}
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1.5 hover:text-green-700"
                >
                  {t("common.profile", "Farmer/Buyer Profile")}
                </Link>
                {role === "admin" && (
                  <Link
                    href="/admin/marketplace"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-1.5 font-bold text-amber-800"
                  >
                    ⚙️ {t("common.admin", "Admin Panel")}
                  </Link>
                )}
              </>
            ) : (
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg border border-gray-200 py-2 text-center text-sm font-semibold text-gray-800"
                >
                  {t("common.login", "Sign In")}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-green-800 py-2 text-center text-sm font-semibold text-white"
                >
                  {t("common.register", "Register")}
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
