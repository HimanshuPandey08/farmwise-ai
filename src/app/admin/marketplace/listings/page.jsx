"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

export default function AdminListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalListings, setTotalListings] = useState(0);

  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadListings = useCallback(async () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (statusFilter) params.set("status", statusFilter);
    params.set("page", String(page));
    params.set("limit", "15");

    try {
      const res = await fetch(`/api/admin/marketplace/listings?${params.toString()}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setListings(data.listings || []);
      setTotalPages(data.totalPages || 1);
      setTotalListings(data.total || 0);
    } catch (err) {
      setError(err.message || "Failed to load crop listings.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    loadListings();
  }

  async function handleModerate(listingId, action) {
    const actionLabel = action === "remove" ? "remove" : action === "suspend" ? "pause" : "activate";
    const note = window.prompt(`Provide an optional moderation note for this action (${actionLabel}):`);
    if (note === null) return; // user cancelled

    setActionLoadingId(listingId);
    setSuccessMsg("");
    setError("");

    try {
      const res = await fetch(`/api/admin/marketplace/listings/${listingId}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          note: note.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Moderation action failed.");

      setSuccessMsg(data.message || "Listing moderated successfully.");
      setTimeout(() => setSuccessMsg(""), 4000);
      loadListings();
    } catch (err) {
      setError(err.message || "Failed to moderate listing.");
    } finally {
      setActionLoadingId(null);
    }
  }

  function getStatusBadge(status) {
    switch (status) {
      case "active":
        return <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">Active</span>;
      case "temporarily_unavailable":
        return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">Paused</span>;
      case "sold_out":
        return <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">Sold Out</span>;
      case "expired":
        return <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-[10px] font-bold text-gray-700">Expired</span>;
      case "removed":
        return <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-800">Delisted</span>;
      default:
        return <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold text-gray-600">{status}</span>;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Listing Moderation
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Review, audit, pause, or delist agricultural produce batches to preserve quality and trade integrity.
          </p>
        </div>
        <div>
          <span className="rounded-xl bg-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700">
            {totalListings} {totalListings === 1 ? "Listing" : "Total Listings"}
          </span>
        </div>
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

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search crop, variety, farmer name, district..."
            className="flex-1 rounded-xl border border-gray-300 px-3.5 py-2 text-xs focus:border-emerald-600 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition"
          >
            Search
          </button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 focus:border-emerald-600 focus:outline-none"
        >
          <option value="">All Listing Statuses</option>
          <option value="active">Active Only</option>
          <option value="temporarily_unavailable">Paused / Suspended</option>
          <option value="sold_out">Sold Out</option>
          <option value="expired">Expired</option>
          <option value="removed">Delisted / Removed</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
            <p className="mt-3 text-xs text-gray-500 font-semibold">Loading listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-500">
            No produce listings matched the specified filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-600">
                  <th className="py-3 px-4">Produce</th>
                  <th className="py-3 px-4">Farmer / Origin</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Price / Qtl</th>
                  <th className="py-3 px-4">Leads</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {listings.map((item) => {
                  const isBusy = actionLoadingId === item._id;
                  const thumb = item.images?.[0]?.thumbnailUrl || item.images?.[0]?.secureUrl;
                  return (
                    <tr key={item._id} className="hover:bg-gray-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={item.cropName}
                              className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xl">
                              🌾
                            </div>
                          )}
                          <div>
                            <Link
                              href={`/marketplace/crops/${item._id}`}
                              target="_blank"
                              className="font-bold text-gray-900 hover:text-emerald-700 hover:underline"
                            >
                              {item.cropName}
                            </Link>
                            <p className="text-[11px] text-gray-500">
                              {item.variety || "Standard"} • Grade {item.grade || "A"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-800">{item.farmerName || "Farmer"}</p>
                        <p className="text-[11px] text-gray-500">
                          {item.district}, {item.state}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-gray-900">
                          {item.quantity} {item.unit}
                        </span>
                        <span className="block text-[10px] text-gray-500">
                          ({item.normalizedQuantity} Quintals)
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">
                        ₹{item.pricePerQuintal?.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span title="Views">👀 {item.viewsCount ?? 0}</span>
                          <span title="Calls">📞 {item.phoneClicksCount ?? 0}</span>
                          <span title="WhatsApp">📱 {item.whatsappClicksCount ?? 0}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Active / Approve */}
                          {item.status !== "active" && (
                            <button
                              disabled={isBusy}
                              onClick={() => handleModerate(item._id, "approve")}
                              className="rounded-lg bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                              title="Set as Active in Marketplace"
                            >
                              Approve
                            </button>
                          )}

                          {/* Pause / Suspend */}
                          {item.status === "active" && (
                            <button
                              disabled={isBusy}
                              onClick={() => handleModerate(item._id, "suspend")}
                              className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                              title="Temporarily Pause Listing"
                            >
                              Pause
                            </button>
                          )}

                          {/* Delist / Remove */}
                          {item.status !== "removed" && (
                            <button
                              disabled={isBusy}
                              onClick={() => handleModerate(item._id, "remove")}
                              className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                              title="Delist from Marketplace"
                            >
                              Delist
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 bg-gray-50 text-xs">
            <span className="text-gray-600">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1 font-semibold text-gray-700 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1 font-semibold text-gray-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
