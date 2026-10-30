import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { ObjectId } from "mongodb";

export async function PATCH(request, { params }) {
  try {
    const { session, user, error } = await requireAuth(request, ["admin"]);
    if (error) return error;

    const { id } = await params;
    let parsedId;
    try {
      parsedId = new ObjectId(id);
    } catch {
      return NextResponse.json({ error: "Invalid listing ID format." }, { status: 400 });
    }

    const listing = await db.collection("cropListings").findOne({ _id: parsedId });
    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    const body = await request.json();
    const { action, note } = body;

    const validActions = ["remove", "suspend", "restore", "approve"];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: "Invalid moderation action." }, { status: 400 });
    }

    let newStatus = listing.status;
    let notificationText = "";

    if (action === "remove") {
      newStatus = "removed";
      notificationText = `Your crop listing for "${listing.cropName}" has been removed by platform moderation.`;
    } else if (action === "suspend") {
      newStatus = "temporarily_unavailable";
      notificationText = `Your crop listing for "${listing.cropName}" has been temporarily paused by platform moderation for review.`;
    } else if (action === "restore" || action === "approve") {
      newStatus = "active";
      notificationText = `Your crop listing for "${listing.cropName}" is active and available in the marketplace.`;
    }

    await db.collection("cropListings").updateOne(
      { _id: parsedId },
      {
        $set: {
          status: newStatus,
          moderatedAt: new Date(),
          moderatedBy: user.id,
          moderationNote: note ? String(note).trim() : "",
          updatedAt: new Date(),
        },
      }
    );

    // Send notification to farmer
    if (listing.farmerId) {
      await db.collection("marketplaceNotifications").insertOne({
        recipientUserId: listing.farmerId,
        type: "listing_moderation",
        title: "Listing Moderation Update",
        message: notificationText,
        actionUrl: `/marketplace/crops/${listing._id.toString()}`,
        isRead: false,
        createdAt: new Date(),
      });
    }

    // Record audit trail
    await db.collection("adminAuditTrail").insertOne({
      adminId: user.id,
      adminName: user.name,
      listingId: listing._id.toString(),
      cropName: listing.cropName,
      farmerId: listing.farmerId,
      action,
      note: note ? String(note).trim() : "",
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `Listing status updated to "${newStatus}".`,
    });
  } catch (error) {
    console.error("Listing moderation failed:", error);
    return NextResponse.json({ error: "Moderation action failed." }, { status: 500 });
  }
}
