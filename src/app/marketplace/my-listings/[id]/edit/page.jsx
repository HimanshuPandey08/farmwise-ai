"use client";

import { useEffect, useState, use, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ProtectedPage from "@/components/ProtectedPage";

function EditListingContent({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const [cropName, setCropName] = useState("");
  const [pricePerQuintal, setPricePerQuintal] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("Quintal");
  const [status, setStatus] = useState("active");
  const [description, setDescription] = useState("");
  const [renewListing, setRenewListing] = useState(false);

  useEffect(() => {
    fetch(`/api/marketplace/listings/${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        if (d.listing) {
          setCropName(d.listing.cropName);
          setPricePerQuintal(String(d.listing.pricePerQuintal));
          setQuantity(String(d.listing.quantity));
          setUnit(d.listing.unit || "Quintal");
          setStatus(d.listing.status || "active");
          setDescription(d.listing.description || "");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load listing.");
        setLoading(false);
      });
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setSaving(true);

    try {
      const res = await fetch(`/api/marketplace/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pricePerQuintal: Number(pricePerQuintal),
          quantity: Number(quantity),
          status,
          description: description.trim(),
          renewListing,
        }),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Update failed.");

      setMessage({ type: "success", text: "Listing updated successfully!" });
      setTimeout(() => {
        router.push("/marketplace/my-listings");
      }, 1200);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Unable to save updates." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="mx-auto max-w-2xl w-full px-4 py-8 sm:px-6 lg:px-8 flex-1">
          <div className="mb-6">
            <Link href="/marketplace/my-listings" className="text-xs font-semibold text-green-800 hover:underline">
              ← Back to My Listings
            </Link>
            <h1 className="mt-2 text-2xl font-extrabold text-gray-950 sm:text-3xl">
              Edit Produce Listing
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-600">
              Update pricing, remaining stock, or availability for {cropName}.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
            {loading ? (
              <p className="text-sm font-semibold text-gray-500 text-center py-8">Loading listing details...</p>
            ) : error ? (
              <p className="text-sm font-semibold text-red-700 text-center py-8">⚠️ {error}</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {message.text && (
                  <div
                    className={`rounded-xl border p-3.5 text-xs font-semibold ${
                      message.type === "error"
                        ? "border-red-200 bg-red-50 text-red-800"
                        : "border-green-200 bg-green-50 text-green-800"
                    }`}
                  >
                    {message.type === "error" ? "⚠️ " : "✓ "}
                    {message.text}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Crop Name (Read-only)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={cropName}
                    className="w-full rounded-xl border border-gray-200 bg-gray-100 p-2.5 text-xs sm:text-sm text-gray-600 font-semibold cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Available Quantity ({unit})
                    </label>
                    <input
                      type="number"
                      required
                      min="0.1"
                      step="any"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs sm:text-sm text-gray-900 focus:border-green-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Price per Quintal (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={pricePerQuintal}
                      onChange={(e) => setPricePerQuintal(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs sm:text-sm text-gray-900 focus:border-green-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Listing Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-xs sm:text-sm text-gray-900 focus:border-green-600 focus:outline-none"
                  >
                    <option value="active">Active (Available for Buyers)</option>
                    <option value="temporarily_unavailable">Temporarily Unavailable (Paused)</option>
                    <option value="partially_sold">Partially Sold</option>
                    <option value="sold_out">Sold Out</option>
                  </select>
                </div>

                <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3.5">
                  <div className="flex items-center gap-2">
                    <input
                      id="renew"
                      type="checkbox"
                      checked={renewListing}
                      onChange={(e) => setRenewListing(e.target.checked)}
                      className="h-4 w-4 rounded text-green-700"
                    />
                    <label htmlFor="renew" className="text-xs font-bold text-amber-950">
                      Renew listing expiration date for another 30 days
                    </label>
                  </div>
                  <p className="mt-1 text-[11px] text-amber-800">
                    Bumps this produce listing and keeps it active in marketplace search results.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Notes / Description
                  </label>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-xs sm:text-sm text-gray-900 focus:border-green-600 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <Link
                    href="/marketplace/my-listings"
                    className="rounded-xl border border-gray-300 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-green-800 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-green-900 disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </ProtectedPage>
  );
}

export default function EditListingPage({ params }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
            <p className="text-xs font-semibold text-gray-500">Loading editor...</p>
          </div>
        </div>
      }
    >
      <EditListingContent params={params} />
    </Suspense>
  );
}

