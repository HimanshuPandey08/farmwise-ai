"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ProtectedPage from "@/components/ProtectedPage";
import { authClient } from "@/lib/auth-client";
import { useLanguage } from "@/context/LanguageContext";

export default function MarketplaceDashboardPage() {
  const { t } = useLanguage();

  const [session, setSession] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [farmerMetrics, setFarmerMetrics] = useState(null);
  const [farmerRecentListings, setFarmerRecentListings] = useState([]);
  const [savedCount, setSavedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const { data } = await authClient.getSession();
        if (!active || !data) return;

        setSession(data);
        const role = (data.user?.role || "farmer").toLowerCase();

        // Load profile
        const profileRes = await fetch("/api/profile");
        const profileJson = await profileRes.json();
        if (active) setProfileData(profileJson);

        if (role === "farmer" || role === "admin") {
          // Load farmer listing metrics
          const myListingsRes = await fetch("/api/marketplace/my-listings");
          const myListingsJson = await myListingsRes.json();
          if (active && myListingsJson) {
            setFarmerMetrics(myListingsJson.metrics || null);
            setFarmerRecentListings((myListingsJson.listings || []).slice(0, 4));
          }
        }

        if (role === "buyer" || role === "admin") {
          const savedRes = await fetch("/api/marketplace/saved");
          const savedJson = await savedRes.json();
          if (active && Array.isArray(savedJson?.savedListings)) {
            setSavedCount(savedJson.savedListings.length);
          }
        }

        if (active) setLoading(false);
      } catch {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const role = (session?.user?.role || "farmer").toLowerCase();
  const userName = session?.user?.name || "User";

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8 flex-1">
          {/* Welcome Header */}
          <div className="mb-8 rounded-3xl bg-gradient-to-r from-green-950 via-emerald-900 to-green-900 p-6 sm:p-8 text-white shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-400/20 px-3 py-1 text-xs font-bold text-lime-300 ring-1 ring-lime-400/40">
                  <span>{role === "buyer" ? "🏢 Bulk Buyer Account" : role === "admin" ? "⚙️ Administrator" : "🌾 Verified Farmer Account"}</span>
                </span>
                <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl text-white">
                  Welcome, {userName}!
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-lime-100/90 max-w-xl">
                  {role === "buyer"
                    ? "Monitor saved farm produce, receive harvest alerts, and negotiate directly with growers."
                    : "Manage your active crop listings, view buyer phone inquiries, and monitor farm produce engagement."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {role === "farmer" && (
                  <Link
                    href="/marketplace/sell"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-lime-400 px-4 py-2.5 text-xs font-bold text-gray-950 shadow-sm transition hover:bg-lime-300"
                  >
                    <span>➕ Post New Crop</span>
                  </Link>
                )}
                <Link
                  href="/marketplace/crops"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20"
                >
                  <span>Browse Marketplace →</span>
                </Link>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm font-semibold text-gray-500">
              Loading your dashboard...
            </div>
          ) : role === "farmer" ? (
            /* Farmer Dashboard View */
            <div className="space-y-8">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs">
                  <span className="text-xs font-semibold text-gray-500 block">Active Listings</span>
                  <span className="mt-1 text-3xl font-extrabold text-green-800 block">
                    {farmerMetrics?.activeListings || 0}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-0.5 block">ready for sale</span>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs">
                  <span className="text-xs font-semibold text-gray-500 block">Total Listed Quantity</span>
                  <span className="mt-1 text-3xl font-extrabold text-gray-950 block">
                    {farmerMetrics?.totalActiveQuantityQuintals || 0} <span className="text-sm font-medium text-gray-500">Qtl</span>
                  </span>
                  <span className="text-[11px] text-gray-400 mt-0.5 block">available in stock</span>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs">
                  <span className="text-xs font-semibold text-gray-500 block">Phone Calls Received</span>
                  <span className="mt-1 text-3xl font-extrabold text-emerald-700 block">
                    {farmerMetrics?.totalPhoneClicks || 0}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-0.5 block">buyer call clicks</span>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs">
                  <span className="text-xs font-semibold text-gray-500 block">WhatsApp Leads</span>
                  <span className="mt-1 text-3xl font-extrabold text-[#25D366] block">
                    {farmerMetrics?.totalWhatsappClicks || 0}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-0.5 block">chat inquiries</span>
                </div>
              </div>

              {/* Quick Navigation Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Link
                  href="/marketplace/my-listings"
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs hover:shadow-md transition group"
                >
                  <span className="text-2xl">📦</span>
                  <h3 className="mt-2 text-base font-bold text-gray-900 group-hover:text-green-800">
                    Manage Produce Inventory
                  </h3>
                  <p className="mt-1 text-xs text-gray-600">
                    Update prices, mark crops as sold, or renew expiring produce listings.
                  </p>
                </Link>

                <Link
                  href="/diagnose"
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs hover:shadow-md transition group"
                >
                  <span className="text-2xl">🔬</span>
                  <h3 className="mt-2 text-base font-bold text-gray-900 group-hover:text-green-800">
                    AI Crop Disease Diagnosis
                  </h3>
                  <p className="mt-1 text-xs text-gray-600">
                    Take a leaf photograph to verify crop health before harvesting and listing.
                  </p>
                </Link>

                <Link
                  href="/community-intelligence"
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs hover:shadow-md transition group"
                >
                  <span className="text-2xl">📡</span>
                  <h3 className="mt-2 text-base font-bold text-gray-900 group-hover:text-green-800">
                    Community Disease Intelligence
                  </h3>
                  <p className="mt-1 text-xs text-gray-600">
                    Monitor disease outbreak signals across your farming district.
                  </p>
                </Link>
              </div>

              {/* Recent Produce Listings Table */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-gray-950">Recent Harvest Listings</h3>
                  <Link href="/marketplace/my-listings" className="text-xs font-bold text-green-800 hover:underline">
                    View all inventory →
                  </Link>
                </div>

                {farmerRecentListings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs text-gray-500">No active produce listings found.</p>
                    <Link
                      href="/marketplace/sell"
                      className="mt-3 inline-block rounded-xl bg-green-800 px-4 py-2 text-xs font-bold text-white hover:bg-green-900"
                    >
                      Post Your First Produce
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {farmerRecentListings.map((l) => (
                      <div key={l._id} className="py-3 flex items-center justify-between gap-4">
                        <div>
                          <Link href={`/marketplace/crops/${l._id}`} className="font-bold text-sm text-gray-900 hover:text-green-800">
                            {l.cropName} {l.variety && `(${l.variety})`}
                          </Link>
                          <p className="text-xs text-gray-500">
                            {l.quantity} {l.unit || "Quintals"} • Listed on {new Date(l.createdAt).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-sm text-green-950 block">
                            ₹{Number(l.pricePerQuintal).toLocaleString("en-IN")}/q
                          </span>
                          <span className="text-[10px] font-bold text-green-700">{l.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Buyer Dashboard View */
            <div className="space-y-8">
              {/* Buyer Overview Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Link
                  href="/marketplace/saved"
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs hover:shadow-md transition"
                >
                  <span className="text-3xl">❤️</span>
                  <span className="mt-3 text-3xl font-extrabold text-gray-950 block">{savedCount}</span>
                  <h3 className="font-bold text-sm text-gray-900">Saved Harvests</h3>
                  <p className="mt-1 text-xs text-gray-500">Click to view bookmarked produce listings.</p>
                </Link>

                <Link
                  href="/marketplace/crops"
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs hover:shadow-md transition"
                >
                  <span className="text-3xl">🌾</span>
                  <h3 className="mt-3 text-base font-bold text-gray-900">Browse Full Catalog</h3>
                  <p className="mt-1 text-xs text-gray-500">Filter harvests by crop type, grade, district, and lot size.</p>
                </Link>

                <Link
                  href="/profile"
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs hover:shadow-md transition"
                >
                  <span className="text-3xl">🏢</span>
                  <h3 className="mt-3 text-base font-bold text-gray-900">Buyer Business Profile</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    {profileData?.profile?.businessName || "Set your business name and procurement preferences."}
                  </p>
                </Link>
              </div>

              {/* Direct Discovery Shortcuts */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
                <h3 className="text-base font-bold text-gray-950 mb-4">Popular Commodity Channels</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { name: "Food Grains & Wheat", slug: "food-grains", icon: "🌾" },
                    { name: "Pulses & Dal", slug: "pulses", icon: "🥣" },
                    { name: "Fresh Vegetables", slug: "vegetables", icon: "🥬" },
                    { name: "Fruits & Citrus", slug: "fruits", icon: "🍎" },
                    { name: "Mustard & Oilseeds", slug: "oilseeds", icon: "🌻" },
                    { name: "Cotton & Cash Crops", slug: "cash-crops", icon: "🌿" },
                    { name: "Spices & Condiments", slug: "spices", icon: "🌶️" },
                    { name: "All Harvests", slug: "", icon: "📦" },
                  ].map((chan) => (
                    <Link
                      key={chan.name}
                      href={chan.slug ? `/marketplace/crops?category=${chan.slug}` : "/marketplace/crops"}
                      className="flex items-center gap-2 rounded-xl border border-gray-200 p-3 text-xs font-bold text-gray-800 hover:border-green-600 hover:bg-green-50/50 transition"
                    >
                      <span className="text-lg">{chan.icon}</span>
                      <span>{chan.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedPage>
  );
}
