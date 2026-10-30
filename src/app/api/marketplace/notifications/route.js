import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";

export async function GET(request) {
  try {
    const { session, user, error } = await requireAuth(request);
    if (error) return error;

    const [notifications, unreadCount] = await Promise.all([
      db
        .collection("marketplaceNotifications")
        .find({ recipientUserId: user.id })
        .sort({ createdAt: -1 })
        .limit(30)
        .toArray(),
      db.collection("marketplaceNotifications").countDocuments({
        recipientUserId: user.id,
        isRead: false,
      }),
    ]);

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        ...n,
        _id: n._id.toString(),
      })),
      unreadCount,
    });
  } catch (error) {
    console.error("Fetch notifications failed:", error);
    return NextResponse.json({ error: "Failed to load notifications." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { session, user, error } = await requireAuth(request);
    if (error) return error;

    // Mark all as read
    await db.collection("marketplaceNotifications").updateMany(
      { recipientUserId: user.id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return NextResponse.json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Mark all notifications failed:", error);
    return NextResponse.json({ error: "Failed to update notifications." }, { status: 500 });
  }
}
