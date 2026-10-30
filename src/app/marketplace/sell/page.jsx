"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ProtectedPage from "@/components/ProtectedPage";
import { useLanguage } from "@/context/LanguageContext";
import { INDIAN_STATES, getDistrictsForState } from "@/lib/india-locations";
import { INITIAL_CROP_CATEGORIES, getCategoryBySlug } from "@/lib/crop-categories";

export default function SellCropPage() {
  const router = useRouter();
  const { t, language } = useLanguage();

  // Form State
  const [cropCategory, setCropCategory] = useState("food-grains");
  const [cropName, setCropName] = useState("");
  const [variety, setVariety] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("Quintal");
  const [pricePerQuintal, setPricePerQuintal] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [village, setVillage] = useState("");
  const [grade, setGrade] = useState("Standard");
  const [harvestDate, setHarvestDate] = useState("");
  const [moisturePercent, setMoisturePercent] = useState("");
  const [packagingType, setPackagingType] = useState("Gunny Bags (Jute)");
  const [storageInfo, setStorageInfo] = useState("Farm Barn / Warehouse");
  const [deliveryArrangements, setDeliveryArrangements] = useState("Buyer arranges pickup from farm");
  const [description, setDescription] = useState("");
  const [partialPurchaseAllowed, setPartialPurchaseAllowed] = useState(true);
  const [minimumOrderQuantity, setMinimumOrderQuantity] = useState("5");
  const [linkedDiagnosisId, setLinkedDiagnosisId] = useState("");

  // Photos State
  const [images, setImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");

  // Existing diagnoses list for optional AI screening link
  const [diagnoses, setDiagnoses] = useState([]);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const activeCategoryObj = getCategoryBySlug(cropCategory);
  const popularCropsForCategory = activeCategoryObj?.popularCrops || [];
  const selectedCropObj = popularCropsForCategory.find((c) => c.name.toLowerCase() === cropName.toLowerCase());
  const availableVarieties = selectedCropObj?.varieties || [];
  const availableDistricts = state ? getDistrictsForState(state) : [];

  useEffect(() => {
    // Load farmer's diagnoses to offer optional AI screening badge link
    fetch("/api/diagnoses")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.diagnoses)) {
          setDiagnoses(d.diagnoses);
        }
      })
      .catch(() => {});

    // Try prefilling location from farmer profile if available
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d?.profile) {
          if (d.profile.state) setState(d.profile.state);
          if (d.profile.district) setDistrict(d.profile.district);
          if (d.profile.village) setVillage(d.profile.village);
        }
      })
      .catch(() => {});
  }, []);

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (images.length >= 5) {
      setImageError("Maximum 5 photographs allowed per listing.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setImageError("Only JPEG, PNG, and WebP images are supported.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image size must be smaller than 5 MB.");
      return;
    }

    setImageError("");
    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("uploadType", "listing");

      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Image upload failed.");

      setImages((prev) => [...prev, { secureUrl: data.secureUrl, publicId: data.publicId }]);
    } catch (err) {
      setImageError(err.message || "Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  }

  function handleRemoveImage(index) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!cropName.trim()) {
      setMessage({ type: "error", text: "Please enter or select a crop name." });
      return;
    }

    const numQty = Number(quantity);
    if (!numQty || numQty <= 0) {
      setMessage({ type: "error", text: "Please provide a valid quantity greater than zero." });
      return;
    }

    const numPrice = Number(pricePerQuintal);
    if (!numPrice || numPrice <= 0) {
      setMessage({ type: "error", text: "Please enter an expected price per quintal." });
      return;
    }

    if (!state) {
      setMessage({ type: "error", text: "Please select the state where produce is located." });
      return;
    }

    if (!district) {
      setMessage({ type: "error", text: "Please select the district where produce is located." });
      return;
    }

    if (images.length === 0) {
      setMessage({ type: "error", text: "Please upload at least 1 photograph of your crop produce." });
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/marketplace/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropName: cropName.trim(),
          cropCategory,
          variety: variety.trim(),
          quantity: numQty,
          unit,
          pricePerQuintal: numPrice,
          state,
          district,
          village: village.trim(),
          images,
          grade,
          harvestDate: harvestDate || null,
          moisturePercent: moisturePercent ? Number(moisturePercent) : null,
          packagingType,
          storageInfo,
          deliveryArrangements,
          description: description.trim(),
          partialPurchaseAllowed,
          minimumOrderQuantity: partialPurchaseAllowed ? Number(minimumOrderQuantity) || 1 : numQty,
          linkedDiagnosisId: linkedDiagnosisId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create crop listing.");

      setMessage({
        type: "success",
        text: "Produce listing published successfully! Redirecting to your inventory...",
      });

      setTimeout(() => {
        router.push("/marketplace/my-listings");
      }, 1500);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to publish listing." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="mx-auto max-w-4xl w-full px-4 py-8 sm:px-6 lg:px-8 flex-1">
          {/* Header */}
          <div className="mb-8">
            <Link href="/marketplace/dashboard" className="text-xs font-semibold text-green-800 hover:underline">
              ← Back to Dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-extrabold text-gray-950 sm:text-3xl">
              {t("sell.title", "List Harvested Crop Produce")}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-600">
              {t("sell.subtitle", "Publish your available crop for sale to thousands of verified bulk buyers across India.")}
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
            {message.text && (
              <div
                className={`mb-6 flex items-start gap-2.5 rounded-xl border p-4 text-xs font-medium ${
                  message.type === "error"
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-green-200 bg-green-50 text-green-800"
                }`}
              >
                <span>{message.type === "error" ? "⚠️" : "✅"}</span>
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category & Crop Details */}
              <div className="border-b border-gray-100 pb-6 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-green-900">
                  1. Crop Information
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Crop Category *
                    </label>
                    <select
                      value={cropCategory}
                      onChange={(e) => {
                        setCropCategory(e.target.value);
                        setCropName("");
                        setVariety("");
                      }}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs sm:text-sm text-gray-900 focus:border-green-600 focus:outline-none"
                    >
                      {INITIAL_CROP_CATEGORIES.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.icon} {c.name[language] || c.name.en}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Crop Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={cropName}
                      onChange={(e) => setCropName(e.target.value)}
                      placeholder="e.g. Wheat, Tomato, Soybean"
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs sm:text-sm text-gray-900 focus:border-green-600 focus:outline-none"
                    />

                    {/* Popular Suggestions */}
                    {popularCropsForCategory.length > 0 && !cropName && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {popularCropsForCategory.slice(0, 5).map((c) => (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => setCropName(c.name)}
                            className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700 hover:bg-green-100 hover:text-green-900"
                          >
                            + {c.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Crop Variety (Optional)
                    </label>
                    <input
                      type="text"
                      value={variety}
                      onChange={(e) => setVariety(e.target.value)}
                      placeholder="e.g. Sharbati, Lokwan, Hybrid Vaishali"
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs sm:text-sm text-gray-900 focus:border-green-600 focus:outline-none"
                    />
                    {availableVarieties.length > 0 && !variety && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {availableVarieties.slice(0, 4).map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setVariety(v)}
                            className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700 hover:bg-green-100"
                          >
                            + {v}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Quality Grade
                    </label>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs sm:text-sm text-gray-900 focus:border-green-600 focus:outline-none"
                    >
                      <option value="Grade A">Grade A (Premium Quality)</option>
                      <option value="Grade B">Grade B (Standard Commercial)</option>
                      <option value="Organic">Organic Certified</option>
                      <option value="Standard">Standard</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Quantity and Pricing */}
              <div className="border-b border-gray-100 pb-6 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-green-900">
                  2. Quantity & Pricing
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Available Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min="0.1"
                      step="any"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="e.g. 50"
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs sm:text-sm text-gray-900 focus:border-green-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Quantity Unit
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs sm:text-sm text-gray-900 focus:border-green-600 focus:outline-none"
                    >
                      <option value="Quintal">Quintal (100 kg)</option>
                      <option value="Tonne">Tonne (1,000 kg / 10 Qtl)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Expected Price (₹ / Quintal) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={pricePerQuintal}
                      onChange={(e) => setPricePerQuintal(e.target.value)}
                      placeholder="e.g. 2800"
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs sm:text-sm text-gray-900 focus:border-green-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-gray-50 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      id="partial-allowed"
                      type="checkbox"
                      checked={partialPurchaseAllowed}
                      onChange={(e) => setPartialPurchaseAllowed(e.target.checked)}
                      className="h-4 w-4 rounded text-green-700 focus:ring-green-600"
                    />
                    <label htmlFor="partial-allowed" className="text-xs font-semibold text-gray-800">
                      Allow partial purchases (buyers can purchase a portion of the lot)
                    </label>
                  </div>

                  {partialPurchaseAllowed && (
                    <div className="max-w-xs">
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        Minimum Order Quantity (in Quintals)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={minimumOrderQuantity}
                        onChange={(e) => setMinimumOrderQuantity(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 p-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Produce Location */}
              <div className="border-b border-gray-100 pb-6 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-green-900">
                  3. Location for Pickup & Inspection
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      State *
                    </label>
                    <select
                      value={state}
                      required
                      onChange={(e) => {
                        setState(e.target.value);
                        setDistrict("");
                      }}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs sm:text-sm text-gray-900 focus:border-green-600 focus:outline-none"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      District *
                    </label>
                    <select
                      value={district}
                      required
                      disabled={!state}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs sm:text-sm text-gray-900 focus:border-green-600 focus:outline-none disabled:bg-gray-100"
                    >
                      <option value="">{state ? "Select District" : "Select State First"}</option>
                      {availableDistricts.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Village / Town / Mandi Area
                    </label>
                    <input
                      type="text"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      placeholder="e.g. Kothrud / APMC Mandi"
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs sm:text-sm text-gray-900 focus:border-green-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Photographs Upload */}
              <div className="border-b border-gray-100 pb-6 space-y-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-green-900">
                    4. Produce Photographs *
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Upload 1 to 5 clear photographs of the harvested crop, bag lot, or grain sample.
                  </p>
                </div>

                {imageError && (
                  <p className="text-xs font-semibold text-red-700">⚠️ {imageError}</p>
                )}

                {/* Photo Previews */}
                <div className="flex flex-wrap gap-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative h-24 w-24 rounded-xl overflow-hidden border border-gray-200">
                      <img src={img.secureUrl} alt="Produce" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-white hover:bg-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {images.length < 5 && (
                    <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:border-green-600 hover:bg-white transition">
                      <span className="text-xl">📷</span>
                      <span className="mt-1 text-[10px] font-bold">
                        {uploadingImage ? "Uploading..." : "Add Photo"}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={uploadingImage}
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Optional Health Certification & Storage Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-green-900">
                  5. Additional Details & Health Verification
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Harvest Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={harvestDate}
                      onChange={(e) => setHarvestDate(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-green-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Moisture % (Optional)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={moisturePercent}
                      onChange={(e) => setMoisturePercent(e.target.value)}
                      placeholder="e.g. 12.5"
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-green-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Packaging Type
                    </label>
                    <input
                      type="text"
                      value={packagingType}
                      onChange={(e) => setPackagingType(e.target.value)}
                      placeholder="e.g. 50kg Gunny Bags, Crates, Loose"
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-green-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Storage Facility
                    </label>
                    <input
                      type="text"
                      value={storageInfo}
                      onChange={(e) => setStorageInfo(e.target.value)}
                      placeholder="e.g. Covered Barn, Cold Storage, Silo"
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-green-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Optional Link Clean Diagnosis */}
                {diagnoses.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Link a FarmWise AI Crop Diagnosis (Optional)
                    </label>
                    <select
                      value={linkedDiagnosisId}
                      onChange={(e) => setLinkedDiagnosisId(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-green-600 focus:outline-none"
                    >
                      <option value="">Do not link a diagnosis report</option>
                      {diagnoses.map((diag) => (
                        <option key={diag._id} value={diag._id}>
                          {diag.cropName} ({new Date(diag.createdAt).toLocaleDateString("en-IN")}) — {t("marketplace.aiDiagnosisTag", "AI-Assisted Screening Info")}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px] text-gray-500">
                      {t("marketplace.aiDiagnosisNotice", "Informational visual screening; not an official laboratory certificate, pesticide-free guarantee, or government regulatory certification.")}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Additional Description / Logistics
                  </label>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Specify any relevant trade terms, grain quality specifics, or truck loading availability..."
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-xs sm:text-sm text-gray-900 focus:border-green-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-800 px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:opacity-60"
                >
                  {submitting ? "Publishing Produce Listing..." : "Publish Produce for Sale →"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </ProtectedPage>
  );
}
