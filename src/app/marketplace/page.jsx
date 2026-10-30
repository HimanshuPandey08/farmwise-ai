"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/context/LanguageContext";
import { INITIAL_CROP_CATEGORIES } from "@/lib/crop-categories";

export default function MarketplaceHomePage() {
  const router = useRouter();
  const { t, language } = useLanguage();

  const [categories, setCategories] = useState(INITIAL_CROP_CATEGORIES);
  const [recentListings, setRecentListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let active = true;

    // Fetch live categories from API
    fetch("/api/marketplace/categories")
      .then((r) => r.json())
      .then((d) => {
        if (active && Array.isArray(d?.categories) && d.categories.length > 0) {
          setCategories(d.categories);
        }
      })
      .catch(() => {});

    // Fetch recent active listings
    fetch("/api/marketplace/listings?limit=8&sort=newest")
      .then((r) => r.json())
      .then((d) => {
        if (active) {
          setRecentListings(Array.isArray(d?.listings) ? d.listings : []);
          setLoadingListings(false);
        }
      })
      .catch(() => {
        if (active) setLoadingListings(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/marketplace/crops?q=${encodeURIComponent(searchQuery.trim())}`);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Hero Search Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-green-950 via-emerald-900 to-green-900 px-4 py-12 text-white sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-400/20 px-3.5 py-1 text-xs font-bold text-lime-300 ring-1 ring-lime-400/40">
            <span>🌾</span>
            <span>Direct Agricultural Trade Across India</span>
          </span>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white">
            {t("marketplace.title", "Agricultural Produce Marketplace")}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-lime-100 sm:text-base">
            {t(
              "marketplace.subtitle",
              "Connect directly with farmers and bulk buyers across India. Fresh harvests, transparent prices, direct farmer-to-buyer connections."
            )}
          </p>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-8 flex flex-col sm:flex-row items-center gap-2 rounded-2xl bg-white p-2 shadow-2xl"
          >
            <div className="relative flex-1 w-full flex items-center">
              <span className="pl-3.5 text-lg text-gray-400" aria-hidden="true">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t(
                  "marketplace.searchPlaceholder",
                  "Search by crop (e.g. Wheat, Tomato), variety, or district..."
                )}
                className="w-full bg-transparent px-3 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-green-800 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
            >
              <span>{t("common.search", "Search")}</span>
              <span>→</span>
            </button>
          </form>

          {/* Quick Action Badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-lime-200">
            <span className="font-semibold text-white">Popular Crops:</span>
            {["Wheat", "Rice / Paddy", "Tomato", "Potato", "Onion", "Chana", "Cotton", "Mustard"].map((crop) => (
              <Link
                key={crop}
                href={`/marketplace/crops?q=${encodeURIComponent(crop)}`}
                className="rounded-full bg-white/10 px-3 py-1 font-medium transition hover:bg-white/20 hover:text-white"
              >
                {crop}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="border-b border-gray-200 bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
                {t("marketplace.browseCategories", "Browse by Crop Category")}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-gray-600">
                Explore produce categories sourced directly from Indian farms
              </p>
            </div>
            <Link
              href="/marketplace/crops"
              className="text-xs sm:text-sm font-bold text-green-800 hover:text-green-950 hover:underline inline-flex items-center gap-1"
            >
              <span>View all produce</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {categories.map((cat) => {
              const localizedName =
                typeof cat.name === "object"
                  ? cat.name[language] || cat.name.en || cat.slug
                  : cat.name;

              return (
                <Link
                  key={cat.slug}
                  href={`/marketplace/crops?category=${encodeURIComponent(cat.slug)}`}
                  className="group flex flex-col items-center rounded-2xl border border-gray-200/90 bg-gray-50/50 p-4 text-center transition hover:-translate-y-1 hover:border-green-600 hover:bg-white hover:shadow-md"
                >
                  <span className="text-3xl transition group-hover:scale-110" aria-hidden="true">
                    {cat.icon || "🌱"}
                  </span>
                  <span className="mt-2.5 text-xs font-bold text-gray-900 group-hover:text-green-800 line-clamp-1">
                    {localizedName}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recently Listed Produce */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
                {t("marketplace.recentListings", "Recently Listed Harvests")}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-gray-600">
                Fresh agricultural produce ready for bulk dispatch
              </p>
            </div>
            <Link
              href="/marketplace/crops"
              className="text-xs sm:text-sm font-bold text-green-800 hover:text-green-950 hover:underline inline-flex items-center gap-1"
            >
              <span>Browse full catalog</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          {loadingListings ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
                  <div className="h-44 w-full rounded-xl bg-gray-200" />
                  <div className="mt-4 h-4 w-3/4 rounded bg-gray-200" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-gray-100" />
                  <div className="mt-4 h-5 w-1/3 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : recentListings.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center shadow-xs">
              <span className="text-4xl">🌾</span>
              <h3 className="mt-3 text-base font-bold text-gray-900">No crop produce listed yet</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                Be the first farmer to list your harvested crop and reach bulk buyers across India.
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
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {recentListings.map((listing) => {
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
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-bold text-gray-950 group-hover:text-green-800 transition line-clamp-1">
                          {listing.cropName}
                        </h3>
                      </div>

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
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-t border-gray-200 bg-white py-14 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
              {t("marketplace.howItWorks", "How FarmWise Marketplace Works")}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-gray-600">
              A simple, direct agricultural trade platform for Indian growers and bulk produce buyers.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-6 text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl text-green-800 mb-4">
                📝
              </span>
              <h3 className="text-base font-bold text-gray-900">
                {t("marketplace.step1Title", "1. Farmers List Produce")}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
                {t("marketplace.step1Desc", "Farmers list harvested crops with quantity, location, price per quintal, and photos.")}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-6 text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-lime-100 text-2xl text-green-900 mb-4">
                🔎
              </span>
              <h3 className="text-base font-bold text-gray-900">
                {t("marketplace.step2Title", "2. Buyers Discover & Filter")}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
                {t("marketplace.step2Desc", "Wholesalers and traders search produce by crop, variety, district, and quality grade.")}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-6 text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-2xl text-amber-900 mb-4">
                🤝
              </span>
              <h3 className="text-base font-bold text-gray-900">
                {t("marketplace.step3Title", "3. Direct Negotiation")}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
                {t("marketplace.step3Desc", "Buyers connect directly with farmers via verified phone or WhatsApp for trade.")}
              </p>
            </div>
          </div>

          {/* Sell Crops CTA Banner */}
          <div className="mt-12 rounded-3xl bg-gradient-to-r from-green-900 to-emerald-950 p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="rounded-md bg-lime-400 px-2.5 py-1 text-xs font-bold text-gray-950 uppercase tracking-wider">
                For Farmers & FPOs
              </span>
              <h3 className="mt-3 text-2xl font-bold sm:text-3xl text-white">
                Have harvested produce ready to sell?
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-lime-100 max-w-xl">
                List your crop in less than 2 minutes. Reach verified millers, exporters, and wholesale buyers across India without any broker fees.
              </p>
            </div>

            <Link
              href="/marketplace/sell"
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-lime-400 px-6 py-3.5 text-sm font-bold text-gray-950 shadow-md transition hover:bg-lime-300"
            >
              <span>➕ List My Produce</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-200 bg-white py-8 px-4 sm:px-6 lg:px-8 text-xs text-gray-500">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 FarmWise AI. Agricultural Technology & Produce Marketplace.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-green-800">Home</Link>
            <Link href="/marketplace/crops" className="hover:text-green-800">Buy Crops</Link>
            <Link href="/marketplace/sell" className="hover:text-green-800">Sell Crops</Link>
            <Link href="/diagnose" className="hover:text-green-800">Diagnose</Link>
            <Link href="/community-intelligence" className="hover:text-green-800">Community</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
