"use client";

import { useEffect, useState, useCallback } from "react";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    slug: "",
    nameEn: "",
    nameHi: "",
    icon: "🌱",
    popularCropsStr: "",
    order: 10,
    isActive: true,
  });

  const loadCategories = useCallback(async () => {
    try {
      const r = await fetch("/api/marketplace/categories");
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      setCategories(data.categories || []);
    } catch (err) {
      setError(err.message || "Failed to load crop categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  function handleStartNew() {
    setFormData({
      slug: "",
      nameEn: "",
      nameHi: "",
      icon: "🌱",
      popularCropsStr: "",
      order: categories.length + 1,
      isActive: true,
    });
    setIsEditing(true);
  }

  function handleStartEdit(cat) {
    setFormData({
      slug: cat.slug,
      nameEn: cat.name?.en || "",
      nameHi: cat.name?.hi || "",
      icon: cat.icon || "🌱",
      popularCropsStr: Array.isArray(cat.popularCrops) ? cat.popularCrops.join(", ") : "",
      order: cat.order ?? 10,
      isActive: cat.isActive !== false,
    });
    setIsEditing(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.slug.trim() || !formData.nameEn.trim()) {
      setError("Slug and English name are required.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMsg("");

    const popularCrops = formData.popularCropsStr
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/admin/marketplace/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: formData.slug.trim(),
          name: {
            en: formData.nameEn.trim(),
            hi: formData.nameHi.trim() || formData.nameEn.trim(),
          },
          icon: formData.icon.trim(),
          popularCrops,
          order: Number(formData.order) || 10,
          isActive: formData.isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save category.");

      setSuccessMsg(data.message || "Category saved successfully.");
      setTimeout(() => setSuccessMsg(""), 4000);
      setIsEditing(false);
      loadCategories();
    } catch (err) {
      setError(err.message || "Could not save category.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Crop Categories
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Define crop master taxonomies, vernacular labels, and popular crop recommendation tags.
          </p>
        </div>
        <button
          onClick={handleStartNew}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition"
        >
          ➕ Add Category
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
          ✅ {successMsg}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800">
          ⚠️ {error}
        </div>
      )}

      {/* Edit / Create Form Modal/Card */}
      {isEditing && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50/40 p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3 mb-4">
            <h2 className="text-sm font-bold text-emerald-950">
              {formData.slug ? `Edit Category: ${formData.slug}` : "Create New Category"}
            </h2>
            <button
              onClick={() => setIsEditing(false)}
              className="text-xs font-bold text-gray-500 hover:text-gray-700"
            >
              ✕ Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Slug (URL-friendly)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. food-grains"
                  required
                  className="w-full rounded-xl border border-gray-300 p-2.5 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Name (English)</label>
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  placeholder="e.g. Food Grains"
                  required
                  className="w-full rounded-xl border border-gray-300 p-2.5 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Name (Hindi)</label>
                <input
                  type="text"
                  value={formData.nameHi}
                  onChange={(e) => setFormData({ ...formData, nameHi: e.target.value })}
                  placeholder="e.g. अन्न / खाद्यान्न"
                  className="w-full rounded-xl border border-gray-300 p-2.5 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Icon (Emoji)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 p-2.5 bg-white text-center text-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 p-2.5 bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded text-emerald-600"
                />
                <label htmlFor="isActiveToggle" className="font-bold text-gray-700">
                  Visible in Marketplace
                </label>
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Popular Crops (comma separated)
              </label>
              <input
                type="text"
                value={formData.popularCropsStr}
                onChange={(e) => setFormData({ ...formData, popularCropsStr: e.target.value })}
                placeholder="Wheat, Paddy / Rice, Maize, Barley, Millets"
                className="w-full rounded-xl border border-gray-300 p-2.5 bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-emerald-700 px-5 py-2 font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Category"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="mt-3 text-xs text-gray-500 font-semibold">Loading crop categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-xs text-gray-500">
          No crop categories found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.slug}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-2xl">
                    {cat.icon || "🌱"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                      Order: {cat.order ?? "—"}
                    </span>
                    {cat.isActive !== false ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-sm text-gray-900">{cat.name?.en || cat.slug}</h3>
                {cat.name?.hi && (
                  <p className="text-xs text-gray-500 font-medium">{cat.name.hi}</p>
                )}
                <p className="font-mono text-[10px] text-gray-400 mt-0.5">{cat.slug}</p>

                <div className="mt-3 flex flex-wrap gap-1">
                  {(cat.popularCrops || []).slice(0, 4).map((crop) => (
                    <span
                      key={crop}
                      className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600"
                    >
                      {crop}
                    </span>
                  ))}
                  {(cat.popularCrops || []).length > 4 && (
                    <span className="text-[10px] font-medium text-gray-400">
                      +{cat.popularCrops.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => handleStartEdit(cat)}
                  className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition"
                >
                  Edit Category
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
