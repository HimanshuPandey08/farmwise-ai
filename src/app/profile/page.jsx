"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ProtectedPage from "@/components/ProtectedPage";
import { useLanguage } from "@/context/LanguageContext";
import { INDIAN_STATES, getDistrictsForState } from "@/lib/india-locations";

const BUYER_CATEGORIES = [
  "Wholesaler / Trader",
  "Processor / Agro Mill",
  "Retail Chain / Supermarket",
  "Exporter",
  "Commission Agent / Mandi Trader",
  "FPO / Cooperative Buyer",
  "HORECA (Hotel/Restaurant/Catering)",
  "Other Bulk Buyer",
];

const SOIL_TYPES = [
  "Alluvial",
  "Black / Regur",
  "Red & Yellow",
  "Laterite",
  "Sandy / Arid",
  "Clay",
  "Loamy",
  "Saline / Alkaline",
  "Other / Unknown",
];

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [role, setRole] = useState("farmer");
  const [userMeta, setUserMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    // Farmer fields
    village: "",
    district: "",
    state: "",
    farmSize: "",
    soilType: "",
    fpoName: "",
    about: "",
    // Buyer fields
    businessName: "",
    businessCategory: "",
    gstin: "",
    deliveryAddress: "",
    businessDescription: "",
  });

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const response = await fetch("/api/profile");
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            router.replace("/login");
            return;
          }
          throw new Error(data.error || "Could not load profile.");
        }

        if (active) {
          const userRole = (data.role || "farmer").toLowerCase();
          setRole(userRole);
          setUserMeta(data.user || null);

          const p = data.profile || {};
          setFormData({
            name: data.user?.name || "",
            phone: data.user?.phone || p.phone || "",
            village: p.village || "",
            district: p.district || "",
            state: p.state || "",
            farmSize: p.farmSize || "",
            soilType: p.soilType || "",
            fpoName: p.fpoName || "",
            about: p.about || "",
            businessName: p.businessName || "",
            businessCategory: p.businessCategory || "",
            gstin: p.gstin || "",
            deliveryAddress: p.deliveryAddress || "",
            businessDescription: p.businessDescription || "",
          });
        }
      } catch (error) {
        if (active) {
          setErrorMessage(error.message || "Could not load profile.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [router]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "state") {
        next.district = ""; // Reset district when state changes
      }
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        throw new Error(data.error || "Could not save profile.");
      }

      setMessage(data.message || "Profile updated successfully.");
      setTimeout(() => setMessage(""), 4000);
    } catch (error) {
      setErrorMessage(error.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  const availableDistricts = formData.state ? getDistrictsForState(formData.state) : [];

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-2xl font-bold text-emerald-800">
                  {role === "buyer" ? "💼" : "🌾"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                      {role === "buyer" ? "Buyer Business Profile" : "Farmer Profile & Preferences"}
                    </h1>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        role === "buyer"
                          ? "bg-blue-100 text-blue-800"
                          : role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {role}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {userMeta?.email} • Member since{" "}
                    {userMeta?.createdAt ? new Date(userMeta.createdAt).toLocaleDateString() : "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/marketplace/dashboard"
                  className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  🏪 View Dashboard
                </Link>
                {role === "admin" && (
                  <Link
                    href="/admin/marketplace"
                    className="rounded-xl bg-purple-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-purple-800 transition"
                  >
                    🛡️ Admin Panel
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Feedback messages */}
          {message && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
              ✅ {message}
            </div>
          )}
          {errorMessage && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800">
              ⚠️ {errorMessage}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-sm">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
              <p className="mt-3 text-xs font-semibold text-gray-500">Loading your profile data...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Personal Information */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
                  Account Identity & Direct Contact
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label htmlFor="name" className="block font-bold text-gray-700 mb-1">
                      Full Name / Contact Person *
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      maxLength={100}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block font-bold text-gray-700 mb-1">
                      10-Digit Mobile Number (Phone & WhatsApp) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500 font-mono font-medium">+91</span>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        maxLength={10}
                        placeholder="9876543210"
                        className="w-full rounded-xl border border-gray-300 py-2.5 pl-12 pr-3 text-xs font-mono focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Role-Specific Fields */}
              {role === "buyer" ? (
                /* Buyer Fields */
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                  <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
                    Business & Commercial Details
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label htmlFor="businessName" className="block font-bold text-gray-700 mb-1">
                        Registered Business / Trading Entity Name
                      </label>
                      <input
                        id="businessName"
                        name="businessName"
                        type="text"
                        value={formData.businessName}
                        onChange={handleChange}
                        placeholder="e.g. Kisan Wholesale Traders Ltd"
                        maxLength={150}
                        className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="businessCategory" className="block font-bold text-gray-700 mb-1">
                        Commercial Category
                      </label>
                      <select
                        id="businessCategory"
                        name="businessCategory"
                        value={formData.businessCategory}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs focus:border-emerald-600 focus:outline-none"
                      >
                        <option value="">Select Business Category</option>
                        {BUYER_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="gstin" className="block font-bold text-gray-700 mb-1">
                        GSTIN (Optional, Verified Badge)
                      </label>
                      <input
                        id="gstin"
                        name="gstin"
                        type="text"
                        value={formData.gstin}
                        onChange={handleChange}
                        placeholder="22AAAAA0000A1Z5"
                        maxLength={15}
                        className="w-full rounded-xl border border-gray-300 p-2.5 text-xs font-mono uppercase focus:border-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="deliveryAddress" className="block font-bold text-gray-700 mb-1">
                        Warehouse / Delivery Destination
                      </label>
                      <input
                        id="deliveryAddress"
                        name="deliveryAddress"
                        type="text"
                        value={formData.deliveryAddress}
                        onChange={handleChange}
                        placeholder="Warehouse 4, APMC Yard, City"
                        maxLength={200}
                        className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label htmlFor="state" className="block font-bold text-gray-700 mb-1">
                        Operating State
                      </label>
                      <select
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs focus:border-emerald-600 focus:outline-none"
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="district" className="block font-bold text-gray-700 mb-1">
                        District / Mandi Zone
                      </label>
                      <select
                        id="district"
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        disabled={!formData.state}
                        className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs focus:border-emerald-600 focus:outline-none disabled:bg-gray-100"
                      >
                        <option value="">Select District</option>
                        {availableDistricts.map((dst) => (
                          <option key={dst} value={dst}>
                            {dst}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="businessDescription" className="block font-bold text-gray-700 mb-1 text-xs">
                      Sourcing Requirements & Business Description
                    </label>
                    <textarea
                      id="businessDescription"
                      name="businessDescription"
                      rows={3}
                      value={formData.businessDescription}
                      onChange={handleChange}
                      placeholder="e.g. Sourcing 50-100 MT of Sharbati Wheat and Basmati 1121 Paddy per season. Prompt payment on delivery."
                      maxLength={500}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                /* Farmer Fields */
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                  <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
                    Agricultural Location & Farm Background
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label htmlFor="state" className="block font-bold text-gray-700 mb-1">
                        State *
                      </label>
                      <select
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs focus:border-emerald-600 focus:outline-none"
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="district" className="block font-bold text-gray-700 mb-1">
                        District *
                      </label>
                      <select
                        id="district"
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        disabled={!formData.state}
                        className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs focus:border-emerald-600 focus:outline-none disabled:bg-gray-100"
                      >
                        <option value="">Select District</option>
                        {availableDistricts.map((dst) => (
                          <option key={dst} value={dst}>
                            {dst}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="village" className="block font-bold text-gray-700 mb-1">
                        Village / Tehsil
                      </label>
                      <input
                        id="village"
                        name="village"
                        type="text"
                        value={formData.village}
                        onChange={handleChange}
                        placeholder="e.g. Rampur"
                        maxLength={150}
                        className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="farmSize" className="block font-bold text-gray-700 mb-1">
                        Farm Size (e.g. 5 Acres / 2 Hectares)
                      </label>
                      <input
                        id="farmSize"
                        name="farmSize"
                        type="text"
                        value={formData.farmSize}
                        onChange={handleChange}
                        placeholder="e.g. 5 Acres"
                        maxLength={100}
                        className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="soilType" className="block font-bold text-gray-700 mb-1">
                        Dominant Soil Type
                      </label>
                      <select
                        id="soilType"
                        name="soilType"
                        value={formData.soilType}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs focus:border-emerald-600 focus:outline-none"
                      >
                        <option value="">Select Soil Type</option>
                        {SOIL_TYPES.map((soil) => (
                          <option key={soil} value={soil}>
                            {soil}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="fpoName" className="block font-bold text-gray-700 mb-1">
                        FPO / Cooperative Society (Optional)
                      </label>
                      <input
                        id="fpoName"
                        name="fpoName"
                        type="text"
                        value={formData.fpoName}
                        onChange={handleChange}
                        placeholder="e.g. Pragati Kisan Producer Co."
                        maxLength={150}
                        className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="about" className="block font-bold text-gray-700 mb-1 text-xs">
                      About Your Farm & Cultivation Practices
                    </label>
                    <textarea
                      id="about"
                      name="about"
                      rows={3}
                      value={formData.about}
                      onChange={handleChange}
                      placeholder="e.g. 3rd-generation farm specializing in organic wheat, basmati paddy, and seasonal vegetables with drip irrigation."
                      maxLength={500}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-gray-200 pt-5">
                <Link
                  href="/"
                  className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition"
                >
                  ← Return to Home
                </Link>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-700 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-60 transition"
                >
                  {saving ? "Saving Changes..." : "Save Profile Details"}
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </ProtectedPage>
  );
}
