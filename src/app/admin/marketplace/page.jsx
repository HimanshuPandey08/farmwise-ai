"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/marketplace/stats");
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      setStats(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Failed to load platform analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading && !stats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-xs font-semibold text-gray-600">Loading marketplace telemetry...</p>
        </div>
      </div>
    );
  }

  const metrics = stats?.metrics || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Marketplace Overview
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Real-time pan-India agricultural trade analytics, inventory volume, and platform moderation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
          <button
            onClick={loadStats}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          ⚠️ {error}
        </div>
      )}

      {/* Moderation Alert Banner */}
      {metrics.pendingReports > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                {metrics.pendingReports} Listing {metrics.pendingReports === 1 ? "Report Requires" : "Reports Require"} Attention
              </h3>
              <p className="text-xs text-amber-700">
                Community users have flagged potential suspicious activity or inaccurate crop pricing.
              </p>
            </div>
          </div>
          <Link
            href="/admin/marketplace/reports"
            className="shrink-0 rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-900 transition"
          >
            Review Queue →
          </Link>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* User Base Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Users</span>
            <span className="rounded-lg bg-emerald-50 p-2 text-lg text-emerald-700">👥</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-950">{metrics.totalUsers ?? 0}</span>
            <span className="text-xs font-medium text-gray-500">accounts</span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-600">
            <span>🌾 {metrics.totalFarmers ?? 0} Farmers</span>
            <span>💼 {metrics.totalBuyers ?? 0} Buyers</span>
            <span>🛡️ {metrics.totalAdmins ?? 0} Admins</span>
          </div>
        </div>

        {/* Active Produce Volume */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Active Listings</span>
            <span className="rounded-lg bg-lime-50 p-2 text-lg text-lime-700">🌾</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-950">{metrics.activeListings ?? 0}</span>
            <span className="text-xs font-medium text-gray-500">batches live</span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-600">
            <span>📦 {metrics.totalQuantityQuintals ?? 0} Qtl Volume</span>
            <span>⌛ {metrics.expiredListings ?? 0} Expired</span>
          </div>
        </div>

        {/* Direct Trade Inquiries */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Buyer Engagement</span>
            <span className="rounded-lg bg-green-50 p-2 text-lg text-green-700">📞</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-950">
              {(metrics.totalPhoneClicks ?? 0) + (metrics.totalWhatsappClicks ?? 0)}
            </span>
            <span className="text-xs font-medium text-gray-500">trade leads</span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-600">
            <span>📱 {metrics.totalWhatsappClicks ?? 0} WhatsApp</span>
            <span>☎️ {metrics.totalPhoneClicks ?? 0} Calls</span>
            <span>👀 {metrics.totalViews ?? 0} Views</span>
          </div>
        </div>

        {/* Trust & Safety */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Moderation Queue</span>
            <span className="rounded-lg bg-amber-50 p-2 text-lg text-amber-700">🛡️</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-950">{metrics.pendingReports ?? 0}</span>
            <span className="text-xs font-medium text-amber-700">pending resolution</span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-600">
            <span>📋 {metrics.totalReports ?? 0} Total Reports</span>
            <span>🚫 {metrics.suspendedUsers ?? 0} Suspended</span>
          </div>
        </div>
      </div>

      {/* Distribution Charts / Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
            <h2 className="text-base font-bold text-gray-900">Produce Category Distribution</h2>
            <Link
              href="/admin/marketplace/categories"
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Manage Categories →
            </Link>
          </div>

          {!stats?.categoryDistribution || stats.categoryDistribution.length === 0 ? (
            <p className="py-8 text-center text-xs text-gray-500">No active category listings yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.categoryDistribution.map((cat) => {
                const total = metrics.activeListings || 1;
                const pct = Math.round((cat.count / total) * 100);
                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1">
                      <span className="capitalize">{cat.category.replace("-", " ")}</span>
                      <span>
                        {cat.count} listings ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* State Geographic Spread */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
            <h2 className="text-base font-bold text-gray-900">Top Agricultural States</h2>
            <span className="text-xs text-gray-500">By active supply</span>
          </div>

          {!stats?.stateDistribution || stats.stateDistribution.length === 0 ? (
            <p className="py-8 text-center text-xs text-gray-500">No regional data recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.stateDistribution.map((item) => {
                const total = metrics.activeListings || 1;
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={item.state}>
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1">
                      <span>{item.state}</span>
                      <span>
                        {item.count} batches ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-lime-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Admin Actions */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-3">Administrative Operations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/admin/marketplace/users"
            className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 hover:border-emerald-500 hover:bg-emerald-50/50 transition group"
          >
            <span className="text-2xl">👥</span>
            <div>
              <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-800">
                User Management
              </p>
              <p className="text-[11px] text-gray-500">Audit roles, suspend or promote accounts</p>
            </div>
          </Link>

          <Link
            href="/admin/marketplace/listings"
            className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 hover:border-emerald-500 hover:bg-emerald-50/50 transition group"
          >
            <span className="text-2xl">🌾</span>
            <div>
              <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-800">
                Listing Moderation
              </p>
              <p className="text-[11px] text-gray-500">Review, pause or delist suspicious batches</p>
            </div>
          </Link>

          <Link
            href="/admin/marketplace/reports"
            className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 hover:border-emerald-500 hover:bg-emerald-50/50 transition group"
          >
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-800">
                Dispute Resolution
              </p>
              <p className="text-[11px] text-gray-500">Investigate and close buyer & seller reports</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
