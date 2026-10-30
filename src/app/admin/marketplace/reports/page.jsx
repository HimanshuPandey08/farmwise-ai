"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadReports = useCallback(async () => {
    try {
      const r = await fetch("/api/marketplace/reports");
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      setReports(data.reports || []);
    } catch (err) {
      setError(err.message || "Failed to load dispute reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  async function handleUpdateStatus(reportId, status) {
    const adminNotes = window.prompt(`Optional notes for changing status to "${status.replace("_", " ")}":`);
    if (adminNotes === null) return;

    setActionLoadingId(reportId);
    setSuccessMsg("");
    setError("");

    try {
      const res = await fetch(`/api/admin/marketplace/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          adminNotes: adminNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update report.");

      setSuccessMsg(data.message || `Report marked as "${status}".`);
      setTimeout(() => setSuccessMsg(""), 4000);
      loadReports();
    } catch (err) {
      setError(err.message || "Failed to update report status.");
    } finally {
      setActionLoadingId(null);
    }
  }

  const filteredReports = statusFilter
    ? reports.filter((r) => r.status === statusFilter)
    : reports;

  const reasonLabels = {
    fake_listing: "Fake Produce Listing",
    incorrect_info: "Inaccurate Variety / Pricing",
    suspicious_seller: "Suspicious Seller / Phone",
    fraud: "Fraud / Scam Attempt",
    inappropriate: "Inappropriate Content",
    other: "Other Grievance",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Dispute & Moderation Reports
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Investigate community flags on misleading listings, incorrect pricing, or fraudulent behavior.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-xl bg-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700">
            {reports.length} Total Reports
          </span>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
          ✅ {successMsg}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800">
          ⚠️ {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "", label: `All Reports (${reports.length})` },
          {
            key: "pending",
            label: `Pending (${reports.filter((r) => r.status === "pending").length})`,
          },
          {
            key: "under_review",
            label: `Under Review (${reports.filter((r) => r.status === "under_review").length})`,
          },
          {
            key: "resolved",
            label: `Resolved (${reports.filter((r) => r.status === "resolved").length})`,
          },
          {
            key: "dismissed",
            label: `Dismissed (${reports.filter((r) => r.status === "dismissed").length})`,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              statusFilter === tab.key
                ? "bg-emerald-800 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="mt-3 text-xs text-gray-500 font-semibold">Loading dispute reports...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-xs text-gray-500">
          No reports match the selected status filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const isBusy = actionLoadingId === report._id;
            return (
              <div
                key={report._id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-full bg-red-100 p-1.5 text-base">⚠️</span>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        {reasonLabels[report.reason] || report.reason}
                      </h3>
                      <p className="text-[11px] text-gray-500">
                        Submitted {report.createdAt ? new Date(report.createdAt).toLocaleString() : "Recently"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        report.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : report.status === "under_review"
                          ? "bg-blue-100 text-blue-800"
                          : report.status === "resolved"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {report.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Reported Listing & Seller
                    </span>
                    <p className="mt-1 font-bold text-gray-900">
                      🌾 {report.cropName || "Crop Batch"}
                    </p>
                    <p className="text-gray-600">Farmer: {report.farmerName || "Farmer"}</p>
                    {report.listingId && (
                      <Link
                        href={`/marketplace/crops/${report.listingId}`}
                        target="_blank"
                        className="mt-2 inline-block text-[11px] font-semibold text-emerald-700 hover:underline"
                      >
                        Inspect Public Listing →
                      </Link>
                    )}
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Reporter Identity
                    </span>
                    <p className="mt-1 font-bold text-gray-900">
                      👤 {report.reporterName || "Anonymous Reporter"}
                    </p>
                    <p className="text-gray-600">{report.reporterEmail}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-1">ID: {report.reporterUserId}</p>
                  </div>
                </div>

                {report.details && (
                  <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3 text-xs text-gray-700">
                    <p className="font-semibold text-gray-900 mb-1">Grievance Explanation:</p>
                    <p className="italic leading-relaxed">{report.details}</p>
                  </div>
                )}

                {report.adminNotes && (
                  <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-xs text-blue-900">
                    <p className="font-semibold mb-0.5">Moderator Resolution Notes:</p>
                    <p className="leading-relaxed">{report.adminNotes}</p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-3">
                  {report.status !== "under_review" && (
                    <button
                      disabled={isBusy}
                      onClick={() => handleUpdateStatus(report._id, "under_review")}
                      className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                    >
                      Mark Under Review
                    </button>
                  )}

                  {report.status !== "resolved" && (
                    <button
                      disabled={isBusy}
                      onClick={() => handleUpdateStatus(report._id, "resolved")}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Resolve Dispute
                    </button>
                  )}

                  {report.status !== "dismissed" && (
                    <button
                      disabled={isBusy}
                      onClick={() => handleUpdateStatus(report._id, "dismissed")}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Dismiss Report
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
