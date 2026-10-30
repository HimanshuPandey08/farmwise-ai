"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkAdminAuth() {
      try {
        const { data } = await authClient.getSession();
        if (!active) return;

        if (!data || !data.user) {
          router.replace("/login?redirect=" + encodeURIComponent(pathname));
          return;
        }

        if (data.user.role !== "admin") {
          setLoading(false);
          return;
        }

        setSession(data);
        setLoading(false);
      } catch (err) {
        if (active) setLoading(false);
      }
    }

    checkAdminAuth();

    return () => {
      active = false;
    };
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm font-semibold text-gray-700">Verifying administrative access...</p>
        </div>
      </div>
    );
  }

  if (!session || session?.user?.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-3xl">
            🛡️
          </div>
          <h1 className="text-xl font-bold text-gray-900">Administrative Access Required</h1>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            This section is restricted to authorized FarmWise platform administrators. Your current account role does not have administrative privileges.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/marketplace"
              className="inline-flex justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              Return to Marketplace
            </Link>
            <Link
              href="/"
              className="inline-flex justify-center rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Back to FarmWise Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: "Overview", href: "/admin/marketplace", icon: "📊" },
    { name: "Users", href: "/admin/marketplace/users", icon: "👥" },
    { name: "Listings Moderation", href: "/admin/marketplace/listings", icon: "🌾" },
    { name: "Dispute Reports", href: "/admin/marketplace/reports", icon: "⚠️" },
    { name: "Categories", href: "/admin/marketplace/categories", icon: "🗂️" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-emerald-950 text-white px-4 py-3 border-b border-emerald-900">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛡️</span>
          <span className="font-bold text-base tracking-tight">FarmWise Admin</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg bg-emerald-900/60 p-2 text-emerald-200 hover:text-white"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          mobileMenuOpen ? "block" : "hidden"
        } md:block w-full md:w-64 bg-emerald-950 text-white shrink-0 flex flex-col justify-between`}
      >
        <div>
          <div className="hidden md:flex items-center gap-2.5 px-6 py-5 border-b border-emerald-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-800 text-xl text-emerald-300 shadow">
              🛡️
            </span>
            <div>
              <h2 className="font-bold text-sm tracking-tight text-white">FarmWise Admin</h2>
              <p className="text-[11px] text-emerald-400 font-medium">Marketplace Control Center</p>
            </div>
          </div>

          <div className="px-3 py-4">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">
              Navigation
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                      isActive
                        ? "bg-emerald-800 text-white shadow-sm"
                        : "text-emerald-200 hover:bg-emerald-900/60 hover:text-white"
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-emerald-900/80 bg-emerald-950/80">
          <div className="mb-3 px-2">
            <p className="text-xs font-semibold text-white truncate">{session.user.name}</p>
            <p className="text-[11px] text-emerald-400 truncate">{session.user.email}</p>
            <span className="mt-1 inline-block rounded-full bg-emerald-800/80 px-2 py-0.5 text-[10px] font-bold text-emerald-200 uppercase tracking-wider">
              Super Admin
            </span>
          </div>

          <div className="space-y-1 pt-2 border-t border-emerald-900/60">
            <Link
              href="/marketplace"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-emerald-300 hover:bg-emerald-900 hover:text-white transition"
            >
              <span>🏪</span> Marketplace View
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-emerald-300 hover:bg-emerald-900 hover:text-white transition"
            >
              <span>🌱</span> FarmWise Main App
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
