"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ProtectedPage from "@/components/ProtectedPage";
import { useLanguage } from "@/context/LanguageContext";

export default function MyListingsPage() {
  const { t } = useLanguage();

  const [listings, setListings] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const loadMyListings = useCallback(async () => {
    try {
      const res = await fetch("/api/marketplace/my-listings");
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setListings(Array.isArray(d.listings) ? d.listings : []);
      setMetrics(d.metrics || null);
    } catch (err) {
      setError(err.message || "Could not load your listings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyListings();
  }, [loadMyListings]);

  async function handleStatusChange(listingId, newStatus) {
    try {
      const res = await fetch(`/api/marketplace/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Status update failed.");
      setActionMessage(`Listing status updated to ${newStatus.replace("_", " ")}.`);
      setTimeout(() => setActionMessage(""), 3000);
      loadMyListings();
    } catch (err) {
      alert(err.message || "Failed to update status.");
    }
  }

  async function handleRenewListing(listingId) {
    try {
      const res = await fetch(`/api/marketplace/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ renewListing: true }),
      });

      if (!res.ok) throw new Error("Listing renewal failed.");
      setActionMessage("Listing renewed for an additional 30 days!");
      setTimeout(() => setActionMessage(""), 3000);
      loadMyListings();
    } catch (err) {
      alert(err.message || "Failed to renew listing.");
    }
  }

  async function handleDeleteListing(listingId) {
    if (!confirm("Are you sure you want to remove this produce listing from the marketplace?")) {
      return;
    }

    try {
      const res = await fetch(`/api/marketplace/listings/${listingId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to remove listing.");
      setActionMessage("Listing removed successfully.");
      setTimeout(() => setActionMessage(""), 3000);
      loadMyListings();
    } catch (err) {
      alert(err.message || "Failed to remove listing.");
    }
  }

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8 flex-1">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <Link href="/marketplace/dashboard" className="text-xs font-semibold text-green-800 hover:underline">
                ← Back to Dashboard
              </Link>
              <h1 className="mt-1 text-2xl font-extrabold text-gray-950 sm:text-3xl">
                {t("farmerDashboard.myListings", "My Produce Listings")}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-600">
                Manage your harvest inventory, update pricing, and monitor buyer inquiries.
              </p>
            </div>

            <Link
              href="/marketplace/sell"
              className="inline-flex items-center gap-1.5 rounded-xl bg-green-800 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-green-900"
            >
              <span>➕</span>
              <span>Post New Produce</span>
            </Link>
          </div>

          {/* Action Notification */}
          {actionMessage && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-3 text-xs font-semibold text-green-800">
              ✓ {actionMessage}
            </div>
          )}

          {/* Metrics Overview Cards */}
          {metrics && (
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
                <span className="text-xs font-medium text-gray-500 block">Total Listings</span>
                <span className="mt-1 text-2xl font-extrabold text-gray-900 block">{metrics.totalListings}</span>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
                <span className="text-xs font-medium text-gray-500 block">Active Listings</span>
                <span className="mt-1 text-2xl font-extrabold text-green-700 block">{metrics.activeListings}</span>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
                <span className="text-xs font-medium text-gray-500 block">Active Produce</span>
                <span className="mt-1 text-2xl font-extrabold text-gray-900 block">
                  {metrics.totalActiveQuantityQuintals} Qtl
                </span>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
                <span className="text-xs font-medium text-gray-500 block">Total Views</span>
                <span className="mt-1 text-2xl font-extrabold text-gray-900 block">{metrics.totalViews}</span>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
                <span className="text-xs font-medium text-gray-500 block">Phone Calls</span>
                <span className="mt-1 text-2xl font-extrabold text-emerald-700 block">{metrics.totalPhoneClicks}</span>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
                <span className="text-xs font-medium text-gray-500 block">WhatsApp Leads</span>
                <span className="mt-1 text-2xl font-extrabold text-[#25D366] block">{metrics.totalWhatsappClicks}</span>
              </div>
            </div>
          )}

          {/* Inventory Table / Cards */}
          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm font-semibold text-gray-500">
              Loading your listings...
            </div>
          ) : listings.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-xs">
              <span className="text-4xl">🌾</span>
              <h3 className="mt-3 text-base font-bold text-gray-900">You haven&apos;t listed any produce yet</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                Publish your first harvest to connect with verified grain millers, wholesalers, and food processors.
              </p>
              <Link
                href="/marketplace/sell"
                className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-green-800 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-green-900"
              >
                <span>➕</span>
                <span>List Produce for Sale</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map((l) => {
                const img = l.images?.[0]?.secureUrl || (typeof l.images?.[0] === "string" ? l.images[0] : null);

                return (
                  <div
                    key={l._id}
                    className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:shadow-md"
                  >
                    {/* Produce info */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-20 w-20 shrink-0 rounded-xl bg-gray-100 overflow-hidden">
                        {img ? (
                          <img src={img} alt={l.cropName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-3xl">🌾</div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/marketplace/crops/${l._id}`}
                            className="text-base font-bold text-gray-950 hover:text-green-800 truncate"
                          >
                            {l.cropName}
                          </Link>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              l.status === "active"
                                ? "bg-green-100 text-green-900"
                                : l.status === "sold_out"
                                ? "bg-red-100 text-red-900"
                                : l.status === "expired"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {l.status === "active" ? "Available" : l.status.replace("_", " ")}
                          </span>
                        </div>

                        {l.variety && (
                          <p className="text-xs text-gray-500 font-medium">{l.variety}</p>
                        )}

                        <p className="text-xs text-gray-600 mt-1">
                          📍 {l.district}, {l.state} • Listed on {new Date(l.createdAt).toLocaleDateString("en-IN")}
                        </p>

                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                          <span>👁️ {l.viewsCount || 0} views</span>
                          <span>📞 {l.phoneClicksCount || 0} calls</span>
                          <span>💬 {l.whatsappClicksCount || 0} chats</span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Price */}
                    <div className="text-left lg:text-right">
                      <span className="text-lg font-extrabold text-green-950 block">
                        ₹{Number(l.pricePerQuintal).toLocaleString("en-IN")} / quintal
                      </span>
                      <span className="text-xs font-semibold text-gray-800 block">
                        {l.quantity} {l.unit || "Quintals"} available
                      </span>
                      {l.expiresAt && (
                        <span className="text-[10px] text-gray-500 block mt-0.5">
                          Expires: {new Date(l.expiresAt).toLocaleDateString("en-IN")}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t border-gray-100 lg:border-t-0 w-full lg:w-auto">
                      <Link
                        href={`/marketplace/my-listings/${l._id}/edit`}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                      >
                        Edit
                      </Link>

                      {l.status === "active" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(l._id, "sold_out")}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                          >
                            Mark as Sold
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(l._id, "temporarily_unavailable")}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                          >
                            Pause
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(l._id, "active")}
                          className="rounded-lg bg-green-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-900"
                        >
                          Activate
                        </button>
                      )}

                      {/* Renew if expired or close to expiry */}
                      {(l.status === "expired" || l.status === "sold_out") && (
                        <button
                          type="button"
                          onClick={() => handleRenewListing(l._id)}
                          className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600"
                        >
                          Renew (+30 Days)
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteListing(l._id)}
                        className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50"
                        aria-label="Remove listing"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Performance Tips Callout */}
          <div className="mt-12 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-6">
            <h4 className="font-bold text-sm text-green-950 flex items-center gap-2">
              <span>💡</span>
              <span>{t("farmerDashboard.suggestionsTitle", "Listing Performance Tips")}</span>
            </h4>
            <ul className="mt-3 space-y-2 text-xs text-green-900 leading-relaxed list-disc list-inside">
              <li>{t("farmerDashboard.tip1", "Listings with 3+ clear photographs receive 4x more phone inquiries.")}</li>
              <li>{t("farmerDashboard.tip2", "Specify the crop variety and grade to attract premium institutional buyers.")}</li>
              <li>{t("farmerDashboard.tip3", "Keep your available quantity updated when sales occur.")}</li>
            </ul>
          </div>
        </main>
      </div>
    </ProtectedPage>
  );
}
