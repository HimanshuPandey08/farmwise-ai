"use client";

import { useEffect, useState, useCallback } from "react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadUsers = useCallback(async () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (roleFilter) params.set("role", roleFilter);
    params.set("page", String(page));
    params.set("limit", "15");

    try {
      const res = await fetch(`/api/admin/marketplace/users?${params.toString()}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
      setTotalUsers(data.total || 0);
    } catch (err) {
      setError(err.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    loadUsers();
  }

  async function handleAction(userId, action, extra = {}) {
    if (action === "suspend") {
      const confirm = window.confirm("Are you sure you want to suspend this user account? They will be locked out of trade operations.");
      if (!confirm) return;
    }

    setActionLoadingId(userId);
    setSuccessMsg("");
    setError("");

    try {
      const res = await fetch("/api/admin/marketplace/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: userId,
          action,
          ...extra,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed.");

      setSuccessMsg(data.message || "User updated successfully.");
      setTimeout(() => setSuccessMsg(""), 4000);
      loadUsers();
    } catch (err) {
      setError(err.message || "Failed to execute user action.");
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            User Management
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            View registered farmers, bulk buyers, and platform administrators. Audit roles and account statuses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-xl bg-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700">
            {totalUsers} {totalUsers === 1 ? "User" : "Total Users"}
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

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone number..."
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
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 focus:border-emerald-600 focus:outline-none"
        >
          <option value="">All Account Roles</option>
          <option value="farmer">Farmers (🌾)</option>
          <option value="buyer">Bulk Buyers (💼)</option>
          <option value="admin">Administrators (🛡️)</option>
        </select>
      </div>

      {/* User Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
            <p className="mt-3 text-xs text-gray-500 font-semibold">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-500">
            No users matched the search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-600">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => {
                  const isActionBusy = actionLoadingId === u._id;
                  return (
                    <tr key={u._id} className="hover:bg-gray-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">
                            {u.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{u.name}</p>
                            <p className="text-[11px] text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-700">
                        {u.phone || <span className="text-gray-400 italic">No phone</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            u.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : u.role === "buyer"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {u.role === "admin" ? "🛡️ Admin" : u.role === "buyer" ? "💼 Buyer" : "🌾 Farmer"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {u.isSuspended ? (
                          <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Role Switcher */}
                          {u.role !== "admin" && (
                            <select
                              disabled={isActionBusy}
                              value={u.role}
                              onChange={(e) => {
                                const newRole = e.target.value;
                                if (newRole === "admin") {
                                  handleAction(u._id, "promote_admin");
                                } else {
                                  handleAction(u._id, "set_role", { newRole });
                                }
                              }}
                              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 hover:border-gray-300"
                            >
                              <option value="farmer">Farmer</option>
                              <option value="buyer">Buyer</option>
                              <option value="admin">Promote to Admin</option>
                            </select>
                          )}

                          {/* Suspend / Reactivate */}
                          {u.isSuspended ? (
                            <button
                              disabled={isActionBusy}
                              onClick={() => handleAction(u._id, "reactivate")}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              Reactivate
                            </button>
                          ) : (
                            <button
                              disabled={isActionBusy}
                              onClick={() => handleAction(u._id, "suspend")}
                              className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                              Suspend
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
