"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/context/LanguageContext";

function CropDetailContent({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();
  const { t } = useLanguage();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Modals & Feedback
  const [saveStatus, setSaveStatus] = useState("");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("incorrect_info");
  const [reportDetails, setReportDetails] = useState("");
  const [reportMessage, setReportMessage] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadListing() {
      try {
        const res = await fetch(`/api/marketplace/listings/${encodeURIComponent(id)}`);
        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || "Could not load produce listing.");
        }

        if (active) {
          setData(result);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Could not load produce listing.");
          setLoading(false);
        }
      }
    }

    loadListing();

    return () => {
      active = false;
    };
  }, [id]);

  function logEngagementEvent(eventType) {
    fetch("/api/marketplace/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: id, eventType }),
    }).catch(() => {});
  }

  async function handleSaveListing() {
    setSaveStatus("Saving...");
    try {
      const res = await fetch("/api/marketplace/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id }),
      });

      if (res.status === 401) {
        router.push(`/login?redirect=/marketplace/crops/${id}`);
        return;
      }

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to save produce.");

      setSaveStatus("✓ Saved to your favourites!");
      logEngagementEvent("save");
      setTimeout(() => setSaveStatus(""), 3500);
    } catch (err) {
      setSaveStatus(err.message || "Failed to save.");
      setTimeout(() => setSaveStatus(""), 3500);
    }
  }

  async function handleReportSubmit(e) {
    e.preventDefault();
    setReportSubmitting(true);
    setReportMessage("");

    try {
      const res = await fetch("/api/marketplace/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: id,
          reason: reportReason,
          details: reportDetails,
        }),
      });

      if (res.status === 401) {
        router.push(`/login?redirect=/marketplace/crops/${id}`);
        return;
      }

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Report submission failed.");

      setReportMessage("✓ Report submitted to moderation team.");
      setTimeout(() => {
        setReportModalOpen(false);
        setReportMessage("");
        setReportDetails("");
      }, 2500);
    } catch (err) {
      setReportMessage(err.message || "Unable to submit report.");
    } finally {
      setReportSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="mx-auto max-w-5xl w-full p-6 py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-800 border-r-transparent" />
          <p className="mt-4 text-sm font-semibold text-gray-600">Loading crop listing details...</p>
        </main>
      </div>
    );
  }

  if (error || !data?.listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="mx-auto max-w-lg w-full p-6 py-20 text-center">
          <span className="text-4xl">⚠️</span>
          <h2 className="mt-3 text-lg font-bold text-gray-900">Listing Unavailable</h2>
          <p className="mt-1 text-sm text-gray-600">{error || "Listing not found or has been removed."}</p>
          <Link
            href="/marketplace/crops"
            className="mt-6 inline-flex rounded-xl bg-green-800 px-5 py-2.5 text-xs font-bold text-white hover:bg-green-900"
          >
            ← Browse Other Produce
          </Link>
        </main>
      </div>
    );
  }

  const { listing, seller, similarListings } = data;
  const images = Array.isArray(listing.images) && listing.images.length > 0 ? listing.images : [];
  const currentImage =
    images[activeImageIndex]?.secureUrl ||
    (typeof images[activeImageIndex] === "string" ? images[activeImageIndex] : null);

  const cleanPhone = (listing.farmerPhone || "").replace(/\D/g, "");
  const waPrefill = encodeURIComponent(
    `Hello ${listing.farmerName}, I saw your listing for ${listing.quantity} ${listing.unit || "Quintals"} of ${listing.cropName} on FarmWise AI Marketplace (Price: ₹${listing.pricePerQuintal}/quintal). I am interested in purchasing.`
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Breadcrumb Navigation */}
      <div className="border-b border-gray-200 bg-white py-3.5 px-4 sm:px-6 lg:px-8 text-xs text-gray-500">
        <div className="mx-auto max-w-7xl flex items-center gap-2">
          <Link href="/marketplace" className="hover:text-green-800">
            Marketplace
          </Link>
          <span>/</span>
          <Link href={`/marketplace/crops?category=${encodeURIComponent(listing.cropCategory)}`} className="hover:text-green-800 capitalize">
            {listing.cropCategory}
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold truncate">{listing.cropName}</span>
        </div>
      </div>

      {/* Main Listing Content */}
      <main className="mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Photo Gallery (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="relative aspect-4/3 w-full rounded-2xl border border-gray-200 bg-gray-100 overflow-hidden shadow-xs">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={listing.cropName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-6xl">
                  🌾
                </div>
              )}

              {/* Status Badge */}
              <span
                className={`absolute top-3 left-3 rounded-lg px-2.5 py-1 text-xs font-bold text-white shadow-xs ${
                  listing.status === "active"
                    ? "bg-green-700"
                    : listing.status === "sold_out"
                    ? "bg-red-700"
                    : "bg-gray-700"
                }`}
              >
                {listing.status === "active" ? "Available for Sale" : listing.status.replace("_", " ")}
              </span>
            </div>

            {/* Thumbnail Row */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => {
                  const url = typeof img === "string" ? img : img.secureUrl;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative h-18 w-18 shrink-0 rounded-xl overflow-hidden border-2 transition ${
                        activeImageIndex === idx ? "border-green-700" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={url} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Action Bar: Save & Report */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleSaveListing}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50"
              >
                <span>❤️</span>
                <span>{saveStatus || "Save Produce"}</span>
              </button>

              <button
                type="button"
                onClick={() => setReportModalOpen(true)}
                className="text-xs font-semibold text-gray-500 hover:text-red-700 hover:underline"
              >
                🚩 Report listing
              </button>
            </div>
          </div>

          {/* Right Column: Listing Details & Pricing (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-900 uppercase">
                  {listing.cropCategory}
                </span>
                <span className="rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-700">
                  {listing.grade || "Standard Grade"}
                </span>
                {listing.linkedDiagnosisId && (
                  <span className="rounded-md bg-lime-100 px-2.5 py-0.5 text-xs font-bold text-green-950">
                    ℹ️ {t("marketplace.aiDiagnosisTag", "AI-Assisted Screening Info")}
                  </span>
                )}
              </div>

              <h1 className="mt-2 text-2xl font-extrabold text-gray-950 sm:text-3xl">
                {listing.cropName}
              </h1>

              {listing.variety && (
                <p className="text-sm font-semibold text-gray-600 mt-0.5">
                  Variety: {listing.variety}
                </p>
              )}

              <p className="mt-2 text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                <span>📍</span>
                <span>
                  {listing.village ? `${listing.village}, ` : ""}
                  {listing.district}, {listing.state}
                </span>
              </p>
            </div>

            {/* Pricing Box */}
            <div className="rounded-2xl border border-green-200/80 bg-green-50/60 p-5">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div>
                  <span className="text-3xl font-extrabold text-green-950">
                    ₹{Number(listing.pricePerQuintal).toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs font-semibold text-green-800 ml-1.5">
                    / quintal (100 kg)
                  </span>
                </div>

                <div className="text-xs text-green-900 font-medium">
                  Est. Total Value:{" "}
                  <strong>
                    ₹
                    {(
                      Number(listing.pricePerQuintal) * Number(listing.normalizedQuantity)
                    ).toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 pt-3 border-t border-green-200/50 text-xs">
                <div>
                  <span className="text-gray-500 block">Available Quantity:</span>
                  <span className="font-bold text-gray-950 text-sm">
                    {listing.quantity} {listing.unit || "Quintals"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Min. Order Limit:</span>
                  <span className="font-bold text-gray-950 text-sm">
                    {listing.minimumOrderQuantity || 1} Quintal(s)
                  </span>
                </div>
              </div>
            </div>

            {/* Specifications Grid */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs">
              <h3 className="font-bold text-sm text-gray-950 mb-3">Crop Specifications</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                <div>
                  <dt className="text-gray-500">Quality Grade</dt>
                  <dd className="font-semibold text-gray-900">{listing.grade || "Standard"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Partial Purchase Allowed</dt>
                  <dd className="font-semibold text-gray-900">
                    {listing.partialPurchaseAllowed ? "Yes (Bulk or partial)" : "No (Full lot only)"}
                  </dd>
                </div>
                {listing.harvestDate && (
                  <div>
                    <dt className="text-gray-500">Harvest Date</dt>
                    <dd className="font-semibold text-gray-900">
                      {new Date(listing.harvestDate).toLocaleDateString("en-IN")}
                    </dd>
                  </div>
                )}
                {listing.moisturePercent && (
                  <div>
                    <dt className="text-gray-500">Moisture Content</dt>
                    <dd className="font-semibold text-gray-900">{listing.moisturePercent}%</dd>
                  </div>
                )}
                {listing.packagingType && (
                  <div>
                    <dt className="text-gray-500">Packaging Type</dt>
                    <dd className="font-semibold text-gray-900">{listing.packagingType}</dd>
                  </div>
                )}
                {listing.storageInfo && (
                  <div>
                    <dt className="text-gray-500">Storage Facility</dt>
                    <dd className="font-semibold text-gray-900">{listing.storageInfo}</dd>
                  </div>
                )}
                {listing.deliveryArrangements && (
                  <div className="col-span-2">
                    <dt className="text-gray-500">Delivery / Logistics</dt>
                    <dd className="font-semibold text-gray-900">{listing.deliveryArrangements}</dd>
                  </div>
                )}
              </dl>

              {listing.description && (
                <div className="mt-4 pt-3 border-t border-gray-100 text-xs">
                  <h4 className="font-bold text-gray-900 mb-1">Seller Notes</h4>
                  <p className="text-gray-600 leading-relaxed">{listing.description}</p>
                </div>
              )}
            </div>

            {/* AI Screening Disclaimer Info */}
            {listing.linkedDiagnosisId && (
              <div className="rounded-2xl border border-lime-200 bg-lime-50/70 p-4 text-xs text-green-950">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <span>🔬</span>
                  <span>{t("marketplace.aiDiagnosisInfo", "AI-assisted crop diagnosis information")}</span>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {t("marketplace.aiDiagnosisNotice", "Informational visual screening; not an official laboratory certificate, pesticide-free guarantee, or government regulatory certification.")}
                </p>
              </div>
            )}

            {/* Seller Contact & Profile Section */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-gray-950">Seller Information</h3>
                  <p className="text-xs text-gray-600">
                    {seller.name} • {seller.district}, {seller.state}
                  </p>
                  {seller.fpoName && (
                    <span className="mt-1 inline-block rounded bg-lime-100 px-2 py-0.5 text-[10px] font-bold text-green-950">
                      🏛️ Member: {seller.fpoName}
                    </span>
                  )}
                </div>

                <Link
                  href={`/marketplace/profile/${listing.farmerId}`}
                  className="text-xs font-bold text-green-800 hover:underline"
                >
                  View Seller Profile →
                </Link>
              </div>

              {/* Direct Trade CTA */}
              <div className="pt-2 border-t border-gray-100">
                {listing.isAuthenticatedViewer ? (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-700">
                      Direct contact options (negotiate trade directly):
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      {cleanPhone ? (
                        <>
                          <a
                            href={`tel:${cleanPhone}`}
                            onClick={() => logEngagementEvent("phone_click")}
                            className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 rounded-xl bg-green-800 px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-green-900"
                          >
                            <span>📞</span>
                            <span>Call Farmer ({cleanPhone})</span>
                          </a>

                          <a
                            href={`https://wa.me/91${cleanPhone}?text=${waPrefill}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => logEngagementEvent("whatsapp_click")}
                            className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-[#1EBE5D]"
                          >
                            <span>💬</span>
                            <span>WhatsApp Farmer</span>
                          </a>
                        </>
                      ) : (
                        <p className="text-xs text-gray-500">
                          Seller phone number is currently not provided in profile.
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => setEnquiryModalOpen(true)}
                        className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-700 hover:bg-gray-100"
                      >
                        ✉️ Internal Enquiry
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-gray-50 p-4 text-center">
                    <p className="text-xs text-gray-700 font-medium">
                      🔒 Farmer phone number and WhatsApp are protected to prevent unsolicited marketing.
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-3">
                      <Link
                        href={`/login?redirect=/marketplace/crops/${id}`}
                        className="rounded-lg bg-green-800 px-4 py-2 text-xs font-bold text-white hover:bg-green-900"
                      >
                        Sign In to View Contact
                      </Link>
                      <Link
                        href="/register"
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                      >
                        Register
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Similar Produce Section */}
        {Array.isArray(similarListings) && similarListings.length > 0 && (
          <section className="mt-16 pt-10 border-t border-gray-200">
            <h3 className="text-xl font-bold text-gray-950 mb-6">
              Similar Produce Available
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {similarListings.map((sim) => {
                const img = sim.images?.[0]?.secureUrl || (typeof sim.images?.[0] === "string" ? sim.images[0] : null);
                return (
                  <Link
                    key={sim._id}
                    href={`/marketplace/crops/${sim._id}`}
                    className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-xs hover:shadow-md transition"
                  >
                    <div className="h-32 w-full rounded-xl bg-gray-100 overflow-hidden mb-3">
                      {img ? (
                        <img src={img} alt={sim.cropName} className="h-full w-full object-cover group-hover:scale-105 transition" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl">🌾</div>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-gray-900 group-hover:text-green-800 truncate">
                      {sim.cropName}
                    </h4>
                    <p className="text-xs text-gray-500">{sim.district}, {sim.state}</p>
                    <div className="mt-3 flex items-center justify-between text-xs font-bold">
                      <span className="text-green-900">₹{Number(sim.pricePerQuintal).toLocaleString("en-IN")}/q</span>
                      <span className="text-gray-700">{sim.quantity} {sim.unit || "Q"}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* Internal Enquiry Modal (Clear Future Roadmap Notice as per Specification) */}
      {enquiryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-950">Internal Enquiry Message</h3>
            <div className="mt-3 rounded-xl bg-amber-50 p-3.5 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <strong className="font-bold">Notice:</strong> In order to ensure zero latency and maximum speed for agricultural spot trade, FarmWise AI facilitates direct communication via <strong>Phone Call</strong> and <strong>WhatsApp</strong>. Internal database messaging threads are planned for a subsequent update.
            </div>
            <p className="mt-3 text-xs text-gray-600">
              Please use the official Call Seller or WhatsApp Seller buttons on the listing page to finalize quantities and transportation directly with {seller.name}.
            </p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setEnquiryModalOpen(false)}
                className="rounded-xl bg-green-800 px-5 py-2 text-xs font-bold text-white hover:bg-green-900"
              >
                Understood, Back to Listing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-950">Report Produce Listing</h3>
              <button type="button" onClick={() => setReportModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            {reportMessage ? (
              <p className="text-sm font-semibold text-green-700 py-4 text-center">{reportMessage}</p>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for report</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 p-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none"
                  >
                    <option value="incorrect_info">Incorrect Crop Details or Price</option>
                    <option value="fake_listing">Fake / Non-existent Harvest</option>
                    <option value="suspicious_seller">Suspicious or Unresponsive Seller</option>
                    <option value="fraud">Fraudulent or Unsafe Activity</option>
                    <option value="inappropriate">Inappropriate Content or Photos</option>
                    <option value="other">Other issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Additional details (Optional)</label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Describe the discrepancy..."
                    className="w-full rounded-xl border border-gray-300 p-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="rounded-xl bg-red-700 px-4 py-2 text-xs font-bold text-white hover:bg-red-800 disabled:opacity-60"
                  >
                    {reportSubmitting ? "Submitting..." : "Submit Report"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CropDetailPage({ params }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
            <p className="text-xs font-semibold text-gray-500">Loading produce details...</p>
          </div>
        </div>
      }
    >
      <CropDetailContent params={params} />
    </Suspense>
  );
}

