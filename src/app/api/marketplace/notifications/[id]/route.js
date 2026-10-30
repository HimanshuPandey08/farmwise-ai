import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { ObjectId } from "mongodb";

export async function PATCH(request, { params }) {
  try {
    const { session, user, error } = await requireAuth(request);
    if (error) return error;

    const { id } = await params;
    let query;
    try {
      query = { _id: new ObjectId(id), recipientUserId: user.id };
    } catch {
      return NextResponse.json({ error: "Invalid notification ID format." }, { status: 400 });
    }

    await db.collection("marketplaceNotifications").updateOne(query, {
      $set: { isRead: true, readAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark single notification failed:", error);
    return NextResponse.json({ error: "Failed to update notification." }, { status: 500 });
  }
}
