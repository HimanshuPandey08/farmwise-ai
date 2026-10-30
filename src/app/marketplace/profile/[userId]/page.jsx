"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

function PublicProfileContent({ params }) {
  const unwrappedParams = use(params);
  const userId = unwrappedParams.userId;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/marketplace/profiles/${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load profile.");
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="mx-auto max-w-4xl w-full p-8 py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-800 border-r-transparent" />
          <p className="mt-4 text-sm font-semibold text-gray-500">Loading profile...</p>
        </main>
      </div>
    );
  }

  if (error || !data?.profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="mx-auto max-w-lg w-full p-8 py-20 text-center">
          <span className="text-4xl">👤</span>
          <h2 className="mt-3 text-lg font-bold text-gray-900">Profile Not Found</h2>
          <p className="mt-1 text-sm text-gray-500">{error || "This user profile does not exist or has been removed."}</p>
          <Link
            href="/marketplace"
            className="mt-6 inline-flex rounded-xl bg-green-800 px-5 py-2.5 text-xs font-bold text-white hover:bg-green-900"
          >
            ← Back to Marketplace
          </Link>
        </main>
      </div>
    );
  }

  const { profile, activeListings } = data;
  const isFarmer = profile.role === "farmer";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="mx-auto max-w-5xl w-full px-4 py-8 sm:px-6 lg:px-8 flex-1">
        {/* Profile Header Card */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-3xl font-bold text-green-900 overflow-hidden">
              {profile.image ? (
                <img src={profile.image} alt={profile.name} className="h-full w-full object-cover" />
              ) : isFarmer ? (
                "🌾"
              ) : (
                "🏢"
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-gray-950 truncate">{profile.name}</h1>
                <span className="rounded-md bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-900 capitalize">
                  {profile.role}
                </span>
                {profile.fpoName && (
                  <span className="rounded-md bg-lime-100 px-2 py-0.5 text-[11px] font-bold text-green-950">
                    🏛️ FPO: {profile.fpoName}
                  </span>
                )}
              </div>

              {!isFarmer && profile.businessName && (
                <p className="text-sm font-bold text-gray-700 mt-1">
                  {profile.businessName} • {profile.businessCategory || "Bulk Buyer"}
                </p>
              )}

              <p className="text-xs text-gray-500 mt-1">
                📍 {[profile.village, profile.district, profile.state].filter(Boolean).join(", ") || "India"} • Member since{" "}
                {new Date(profile.memberSince).toLocaleDateString("en-IN", {
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>

            {/* Contact Reveal */}
            <div className="sm:border-l sm:border-gray-100 sm:pl-6 pt-3 sm:pt-0 w-full sm:w-auto">
              {profile.isAuthenticatedViewer ? (
                profile.phone ? (
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 block">Verified Mobile:</span>
                    <a
                      href={`tel:${profile.phone}`}
                      className="text-sm font-extrabold text-green-900 hover:underline block"
                    >
                      📞 +91 {profile.phone}
                    </a>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">No public phone</span>
                )
              ) : (
                <Link
                  href={`/login?redirect=/marketplace/profile/${userId}`}
                  className="rounded-lg bg-green-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-green-900 block text-center"
                >
                  Sign In to View Contact
                </Link>
              )}
            </div>
          </div>

          {/* Description / About */}
          {(profile.about || profile.businessDescription) && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                About this {isFarmer ? "Grower" : "Buyer"}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {profile.about || profile.businessDescription}
              </p>
            </div>
          )}
        </div>

        {/* Active Produce Listings (For Farmers) */}
        {isFarmer && (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-bold text-gray-950">
              Active Produce for Sale ({activeListings.length})
            </h2>

            {activeListings.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-xs text-gray-500">
                This farmer currently has no active produce listings in the marketplace.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {activeListings.map((l) => {
                  const img = l.images?.[0]?.secureUrl || (typeof l.images?.[0] === "string" ? l.images[0] : null);

                  return (
                    <Link
                      key={l._id}
                      href={`/marketplace/crops/${l._id}`}
                      className="group flex flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition"
                    >
                      <div className="h-36 w-full bg-gray-100 overflow-hidden">
                        {img ? (
                          <img src={img} alt={l.cropName} className="h-full w-full object-cover group-hover:scale-105 transition" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-3xl">🌾</div>
                        )}
                      </div>
                      <div className="p-4 flex flex-1 flex-col">
                        <h3 className="font-bold text-sm text-gray-950 group-hover:text-green-800 truncate">
                          {l.cropName} {l.variety && `(${l.variety})`}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">📍 {l.district}, {l.state}</p>
                        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                          <span className="font-extrabold text-green-950">
                            ₹{Number(l.pricePerQuintal).toLocaleString("en-IN")}/q
                          </span>
                          <span className="font-semibold text-gray-800">
                            {l.quantity} {l.unit || "Qtl"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function PublicProfilePage({ params }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
            <p className="text-xs font-semibold text-gray-500">Loading user profile...</p>
          </div>
        </div>
      }
    >
      <PublicProfileContent params={params} />
    </Suspense>
  );
}

