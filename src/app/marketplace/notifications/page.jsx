"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ProtectedPage from "@/components/ProtectedPage";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/marketplace/notifications");
      const d = await res.json();
      setNotifications(Array.isArray(d?.notifications) ? d.notifications : []);
      setUnreadCount(d?.unreadCount || 0);
    } catch {
      // Ignore network errors gracefully
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  async function handleMarkAllRead() {
    try {
      await fetch("/api/marketplace/notifications", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      alert("Failed to mark all as read.");
    }
  }

  async function handleMarkSingleRead(id) {
    try {
      await fetch(`/api/marketplace/notifications/${id}`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  }

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="mx-auto max-w-3xl w-full px-4 py-8 sm:px-6 lg:px-8 flex-1">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-950 sm:text-3xl">
                Notifications
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-600">
                Produce updates, search alert matches, and platform advisories.
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="rounded-xl border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100"
              >
                Mark All as Read
              </button>
            )}
          </div>

          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm font-semibold text-gray-500">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-xs">
              <span className="text-4xl">🔔</span>
              <h3 className="mt-3 text-base font-bold text-gray-900">No notifications</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
                You will receive alerts here when matching produce is listed or when your listings receive updates.
              </p>
              <Link
                href="/marketplace"
                className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-green-800 px-5 py-2.5 text-xs font-bold text-white hover:bg-green-900"
              >
                Go to Marketplace →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => !n.isRead && handleMarkSingleRead(n._id)}
                  className={`flex items-start justify-between gap-4 rounded-2xl border p-4 shadow-2xs transition ${
                    n.isRead
                      ? "border-gray-200 bg-white"
                      : "border-green-200 bg-green-50/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">
                      {n.type === "listing_moderation"
                        ? "🛡️"
                        : n.type === "search_match"
                        ? "🌾"
                        : "📢"}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-gray-950 flex items-center gap-2">
                        <span>{n.title}</span>
                        {!n.isRead && (
                          <span className="h-2 w-2 rounded-full bg-green-600 inline-block" />
                        )}
                      </h4>
                      <p className="mt-0.5 text-xs text-gray-700 leading-relaxed">
                        {n.message}
                      </p>
                      <span className="mt-2 text-[10px] text-gray-400 block">
                        {new Date(n.createdAt).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {n.actionUrl && (
                    <Link
                      href={n.actionUrl}
                      className="shrink-0 rounded-lg bg-green-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-900"
                    >
                      View
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedPage>
  );
}
