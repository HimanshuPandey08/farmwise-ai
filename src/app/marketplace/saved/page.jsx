"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ProtectedPage from "@/components/ProtectedPage";

export default function SavedProducePage() {
  const [activeTab, setActiveTab] = useState("listings"); // "listings" | "searches"
  const [savedListings, setSavedListings] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [listingsData, searchesData] = await Promise.all([
        fetch("/api/marketplace/saved").then((r) => r.json()),
        fetch("/api/marketplace/saved-searches").then((r) => r.json()),
      ]);
      setSavedListings(Array.isArray(listingsData?.savedListings) ? listingsData.savedListings : []);
      setSavedSearches(Array.isArray(searchesData?.savedSearches) ? searchesData.savedSearches : []);
    } catch {
      // Ignore network errors gracefully
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleRemoveSaved(listingId) {
    try {
      await fetch(`/api/marketplace/saved?listingId=${encodeURIComponent(listingId)}`, {
        method: "DELETE",
      });
      setSavedListings((prev) => prev.filter((item) => item._id !== listingId));
    } catch {
      alert("Failed to remove saved listing.");
    }
  }

  async function handleDeleteSearch(searchId) {
    try {
      await fetch(`/api/marketplace/saved-searches?id=${encodeURIComponent(searchId)}`, {
        method: "DELETE",
      });
      setSavedSearches((prev) => prev.filter((item) => item._id !== searchId));
    } catch {
      alert("Failed to remove search alert.");
    }
  }

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8 flex-1">
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-gray-950 sm:text-3xl">
              Saved Produce & Search Alerts
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-600">
              Track your bookmarked harvests and monitor saved search criteria for new farm listings.
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-2 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab("listings")}
              className={`pb-3 text-sm font-bold transition border-b-2 -mb-px ${
                activeTab === "listings"
                  ? "border-green-800 text-green-900"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Saved Harvests ({savedListings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("searches")}
              className={`pb-3 text-sm font-bold transition border-b-2 -mb-px ${
                activeTab === "searches"
                  ? "border-green-800 text-green-900"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Saved Search Alerts ({savedSearches.length})
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm font-semibold text-gray-500">
              Loading your saved items...
            </div>
          ) : activeTab === "listings" ? (
            /* Saved Listings Tab */
            savedListings.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-xs">
                <span className="text-4xl">❤️</span>
                <h3 className="mt-3 text-base font-bold text-gray-900">No saved produce</h3>
                <p className="mt-1 text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
                  Browse the marketplace and bookmark crops you wish to track or compare.
                </p>
                <Link
                  href="/marketplace/crops"
                  className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-green-800 px-5 py-2.5 text-xs font-bold text-white hover:bg-green-900"
                >
                  Browse Produce Catalog →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {savedListings.map((item) => {
                  const img = item.images?.[0]?.secureUrl || (typeof item.images?.[0] === "string" ? item.images[0] : null);

                  return (
                    <div
                      key={item._id}
                      className="group flex flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition"
                    >
                      <div className="relative h-40 w-full bg-gray-100 overflow-hidden">
                        {img ? (
                          <img src={img} alt={item.cropName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-4xl">🌾</div>
                        )}
                        <span className="absolute top-2.5 left-2.5 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                          {item.grade || "Standard"}
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col p-4">
                        <h3 className="text-base font-bold text-gray-950 truncate">{item.cropName}</h3>
                        {item.variety && (
                          <p className="text-xs text-gray-500 font-medium">{item.variety}</p>
                        )}
                        <p className="text-xs text-gray-600 mt-1">
                          📍 {item.district}, {item.state} • Seller: {item.farmerName}
                        </p>

                        <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-gray-100">
                          <div>
                            <span className="text-base font-extrabold text-green-950 block">
                              ₹{Number(item.pricePerQuintal).toLocaleString("en-IN")}
                            </span>
                            <span className="text-[10px] text-gray-500">per quintal</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-gray-900 block">{item.quantity} {item.unit || "Q"}</span>
                            <span className="text-[10px] text-gray-500">available</span>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                          <Link
                            href={`/marketplace/crops/${item._id}`}
                            className="flex-1 text-center rounded-lg bg-green-800 py-2 text-xs font-bold text-white hover:bg-green-900"
                          >
                            View Details
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleRemoveSaved(item._id)}
                            className="rounded-lg border border-gray-300 p-2 text-xs text-gray-500 hover:text-red-700 hover:bg-gray-50"
                            aria-label="Remove from saved"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Saved Searches Tab */
            savedSearches.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-xs">
                <span className="text-4xl">🔔</span>
                <h3 className="mt-3 text-base font-bold text-gray-900">No saved search alerts</h3>
                <p className="mt-1 text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
                  When filtering the marketplace, click &ldquo;Save Search Alert&rdquo; to receive notifications when matching crops are listed.
                </p>
                <Link
                  href="/marketplace/crops"
                  className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-green-800 px-5 py-2.5 text-xs font-bold text-white hover:bg-green-900"
                >
                  Explore Marketplace →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {savedSearches.map((s) => {
                  const queryParams = new URLSearchParams();
                  if (s.filters?.cropName) queryParams.set("q", s.filters.cropName);
                  if (s.filters?.category) queryParams.set("category", s.filters.category);
                  if (s.filters?.state) queryParams.set("state", s.filters.state);
                  if (s.filters?.district) queryParams.set("district", s.filters.district);
                  if (s.filters?.maxPrice) queryParams.set("maxPrice", s.filters.maxPrice);
                  if (s.filters?.minQuantity) queryParams.set("minQuantity", s.filters.minQuantity);

                  return (
                    <div
                      key={s._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-2xs hover:shadow-xs transition"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-gray-950 flex items-center gap-2">
                          <span>🔔</span>
                          <span>{s.title}</span>
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Saved on {new Date(s.createdAt).toLocaleDateString("en-IN")} • Filter:{" "}
                          {[
                            s.filters?.cropName && `Crop: ${s.filters.cropName}`,
                            s.filters?.state && `State: ${s.filters.state}`,
                            s.filters?.district && `District: ${s.filters.district}`,
                            s.filters?.maxPrice && `Max ₹${s.filters.maxPrice}/q`,
                          ]
                            .filter(Boolean)
                            .join(", ") || "All harvests"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/marketplace/crops?${queryParams.toString()}`}
                          className="rounded-lg bg-green-800 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-green-900"
                        >
                          Search Now →
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteSearch(s._id)}
                          className="rounded-lg border border-gray-200 p-1.5 text-xs text-gray-400 hover:text-red-700 hover:bg-gray-50"
                          aria-label="Delete search alert"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </main>
      </div>
    </ProtectedPage>
  );
}
