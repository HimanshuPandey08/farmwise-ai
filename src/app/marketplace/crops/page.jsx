"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/context/LanguageContext";
import { INDIAN_STATES, getDistrictsForState } from "@/lib/india-locations";
import { INITIAL_CROP_CATEGORIES } from "@/lib/crop-categories";

function CropsCatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();

  // Search & Filter state
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [state, setState] = useState(searchParams.get("state") || "");
  const [district, setDistrict] = useState(searchParams.get("district") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [minQuantity, setMinQuantity] = useState(searchParams.get("minQuantity") || "");
  const [grade, setGrade] = useState(searchParams.get("grade") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10));

  // Layout mode: "grid" | "list"
  const [viewMode, setViewMode] = useState("grid");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Data state
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saveSearchSuccess, setSaveSearchSuccess] = useState("");

  const availableDistricts = state ? getDistrictsForState(state) : [];

  const fetchListings = useCallback(async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (state) params.set("state", state);
    if (district) params.set("district", district);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (minQuantity) params.set("minQuantity", minQuantity);
    if (grade) params.set("grade", grade);
    if (sort) params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", "12");

    try {
      const r = await fetch(`/api/marketplace/listings?${params.toString()}`);
      const d = await r.json();
      setListings(Array.isArray(d?.listings) ? d.listings : []);
      setTotal(d?.total || 0);
      setTotalPages(d?.totalPages || 1);
    } catch {
      // Ignore network errors gracefully
    } finally {
      setLoading(false);
    }
  }, [q, category, state, district, minPrice, maxPrice, minQuantity, grade, sort, page]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  function handleFilterSubmit(e) {
    e.preventDefault();
    setPage(1);
    fetchListings();
    setMobileFilterOpen(false);
  }

  function handleResetFilters() {
    setQ("");
    setCategory("");
    setState("");
    setDistrict("");
    setMinPrice("");
    setMaxPrice("");
    setMinQuantity("");
    setGrade("");
    setSort("newest");
    setPage(1);
    router.push("/marketplace/crops");
  }

  async function handleSaveSearch() {
    try {
      const res = await fetch("/api/marketplace/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropName: q,
          category,
          state,
          district,
          minPrice,
          maxPrice,
          minQuantity,
        }),
      });
      if (res.ok) {
        setSaveSearchSuccess("Search criteria saved to your alerts!");
        setTimeout(() => setSaveSearchSuccess(""), 4000);
      } else {
        const d = await res.json();
        alert(d.error || "Please sign in to save search alerts.");
      }
    } catch {
      alert("Unable to save search alert.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Header & Search Bar */}
      <div className="border-b border-gray-200 bg-white py-6 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Link href="/marketplace" className="hover:text-green-800">
                Marketplace
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-semibold">Produce Catalog</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
              {t("common.buyCrops", "Buy Crops & Farm Produce")}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600">
              Showing {total} available harvests across India
            </p>
          </div>

          {/* Quick Search */}
          <form onSubmit={handleFilterSubmit} className="flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search crop, variety, or district..."
                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 pl-9 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/30"
              />
              <span className="absolute left-3 top-2.5 text-xs text-gray-400">🔍</span>
            </div>
            <button
              type="submit"
              className="rounded-xl bg-green-800 px-4 py-2 text-xs sm:text-sm font-bold text-white transition hover:bg-green-900"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="lg:hidden rounded-xl border border-gray-300 p-2 text-sm text-gray-700 hover:bg-gray-100"
              aria-label="Filter"
            >
              ⚙️
            </button>
          </form>
        </div>
      </div>

      {/* Main Catalog Layout */}
      <div className="mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Filters Sidebar (Desktop) */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-sm text-gray-950">
                  {t("marketplace.filterTitle", "Filter Produce")}
                </h3>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-semibold text-green-800 hover:underline"
                >
                  Clear all
                </button>
              </div>

              {/* Crop Category Filter */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white p-2 text-xs font-medium text-gray-800 focus:border-green-600 focus:outline-none"
                >
                  <option value="">All Categories</option>
                  {INITIAL_CROP_CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.icon} {c.name[language] || c.name.en}
                    </option>
                  ))}
                </select>
              </div>

              {/* State Filter */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  State
                </label>
                <select
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value);
                    setDistrict("");
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white p-2 text-xs font-medium text-gray-800 focus:border-green-600 focus:outline-none"
                >
                  <option value="">All India (Any State)</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* District Filter (Conditional) */}
              {state && availableDistricts.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                    District
                  </label>
                  <select
                    value={district}
                    onChange={(e) => {
                      setDistrict(e.target.value);
                      setPage(1);
                    }}
                    className="w-full rounded-xl border border-gray-300 bg-white p-2 text-xs font-medium text-gray-800 focus:border-green-600 focus:outline-none"
                  >
                    <option value="">All Districts in {state}</option>
                    {availableDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quality Grade Filter */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Quality Grade
                </label>
                <select
                  value={grade}
                  onChange={(e) => {
                    setGrade(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white p-2 text-xs font-medium text-gray-800 focus:border-green-600 focus:outline-none"
                >
                  <option value="">Any Quality Grade</option>
                  <option value="Grade A">Grade A (Premium)</option>
                  <option value="Grade B">Grade B</option>
                  <option value="Organic">Organic Certified</option>
                  <option value="Standard">Standard Commercial</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Max Price (₹/Quintal)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 3500"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-gray-300 p-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none"
                />
              </div>

              {/* Min Quantity */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Min Quantity (Quintals)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 50"
                  value={minQuantity}
                  onChange={(e) => {
                    setMinQuantity(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-gray-300 p-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none"
                />
              </div>

              {/* Save Search Button */}
              <div className="pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleSaveSearch}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-green-800/40 bg-green-50 py-2.5 text-xs font-bold text-green-900 transition hover:bg-green-100"
                >
                  <span>🔔</span>
                  <span>Save Search Alert</span>
                </button>
                {saveSearchSuccess && (
                  <p className="mt-1.5 text-[11px] font-medium text-green-700 text-center">
                    {saveSearchSuccess}
                  </p>
                )}
              </div>
            </div>
          </aside>

          {/* Results Grid / List Section */}
          <main className="lg:col-span-3">
            {/* View Controls & Sort */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Sort by:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="cursor-pointer rounded-lg border border-gray-200 bg-white py-1 px-2.5 text-xs font-semibold text-gray-800 focus:border-green-600 focus:outline-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="quantity_desc">Highest Quantity</option>
                </select>
              </div>

              {/* Grid / List View Toggle */}
              <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                    viewMode === "grid" ? "bg-white text-gray-950 shadow-xs" : "text-gray-500"
                  }`}
                  aria-label="Grid view"
                >
                  ▦ Grid
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                    viewMode === "list" ? "bg-white text-gray-950 shadow-xs" : "text-gray-500"
                  }`}
                  aria-label="List view"
                >
                  ☰ List
                </button>
              </div>
            </div>

            {/* Produce Cards */}
            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
                    <div className="h-44 w-full rounded-xl bg-gray-200" />
                    <div className="mt-4 h-4 w-3/4 rounded bg-gray-200" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-gray-100" />
                    <div className="mt-4 h-5 w-1/3 rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-xs">
                <span className="text-4xl">🌾</span>
                <h3 className="mt-3 text-lg font-bold text-gray-950">
                  {t("marketplace.noListingsFound", "No crop listings match your criteria.")}
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                  {t("marketplace.tryAdjusting", "Try adjusting your filters or search keywords.")}
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="rounded-xl bg-green-800 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-green-900"
                  >
                    Reset All Filters
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSearch}
                    className="rounded-xl border border-gray-300 px-4 py-2.5 text-xs font-bold text-gray-700 transition hover:bg-gray-100"
                  >
                    🔔 Save as Search Alert
                  </button>
                </div>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => {
                  const primaryImage =
                    listing.images?.[0]?.secureUrl ||
                    (typeof listing.images?.[0] === "string" ? listing.images[0] : null);

                  return (
                    <Link
                      key={listing._id}
                      href={`/marketplace/crops/${listing._id}`}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                    >
                      {/* Image */}
                      <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                        {primaryImage ? (
                          <img
                            src={primaryImage}
                            alt={listing.cropName}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-4xl">
                            🌾
                          </div>
                        )}
                        <span className="absolute top-2.5 left-2.5 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                          {listing.grade || "Standard"}
                        </span>
                        {listing.linkedDiagnosisId && (
                          <span className="absolute bottom-2.5 left-2.5 rounded-md bg-green-800/90 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                            ℹ️ {t("marketplace.aiDiagnosisTag", "AI Screening Info")}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex flex-1 flex-col p-4">
                        <h3 className="text-base font-bold text-gray-950 group-hover:text-green-800 transition line-clamp-1">
                          {listing.cropName}
                        </h3>

                        {listing.variety && (
                          <p className="text-xs text-gray-500 font-medium line-clamp-1">
                            {listing.variety}
                          </p>
                        )}

                        <div className="mt-2 text-xs text-gray-600 flex items-center gap-1">
                          <span>📍</span>
                          <span className="line-clamp-1">
                            {listing.district}, {listing.state}
                          </span>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                          <div>
                            <span className="text-base font-extrabold text-green-900">
                              ₹{Number(listing.pricePerQuintal).toLocaleString("en-IN")}
                            </span>
                            <span className="text-[10px] text-gray-500 block -mt-0.5">
                              per quintal
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-bold text-gray-900 block">
                              {listing.quantity} {listing.unit || "Quintals"}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              available
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              /* List View */
              <div className="space-y-4">
                {listings.map((listing) => {
                  const primaryImage =
                    listing.images?.[0]?.secureUrl ||
                    (typeof listing.images?.[0] === "string" ? listing.images[0] : null);

                  return (
                    <Link
                      key={listing._id}
                      href={`/marketplace/crops/${listing._id}`}
                      className="group flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs transition hover:shadow-md"
                    >
                      <div className="h-28 w-28 shrink-0 rounded-xl bg-gray-100 overflow-hidden">
                        {primaryImage ? (
                          <img
                            src={primaryImage}
                            alt={listing.cropName}
                            className="h-full w-full object-cover group-hover:scale-105 transition"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-3xl">
                            🌾
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-gray-950 group-hover:text-green-800 transition truncate">
                            {listing.cropName}
                          </h3>
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700">
                            {listing.grade}
                          </span>
                          {listing.linkedDiagnosisId && (
                            <span className="rounded bg-lime-100 px-2 py-0.5 text-[10px] font-bold text-green-950">
                              ℹ️ {t("marketplace.aiDiagnosisTag", "AI Screening Info")}
                            </span>
                          )}
                        </div>
                        {listing.variety && (
                          <p className="text-xs text-gray-500 font-medium">{listing.variety}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-600">
                          📍 {listing.district}, {listing.state} • Seller: {listing.farmerName}
                        </p>
                      </div>

                      <div className="text-right sm:border-l sm:border-gray-100 sm:pl-6">
                        <span className="text-lg font-extrabold text-green-900 block">
                          ₹{Number(listing.pricePerQuintal).toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-gray-500 block">per quintal</span>
                        <span className="text-xs font-semibold text-gray-800 block mt-1">
                          {listing.quantity} {listing.unit || "Quintals"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-40"
                >
                  ← Previous
                </button>
                <span className="text-xs font-medium text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function CropsCatalogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Loading produce catalog...</div>}>
      <CropsCatalogContent />
    </Suspense>
  );
}
