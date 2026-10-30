import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const { session, user, error } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const { listingId, reason, details } = body;

    const validReasons = [
      "fake_listing",
      "incorrect_info",
      "suspicious_seller",
      "fraud",
      "inappropriate",
      "other",
    ];

    if (!listingId || !validReasons.includes(reason)) {
      return NextResponse.json({ error: "Please select a valid report reason." }, { status: 400 });
    }

    let parsedListingId;
    try {
      parsedListingId = new ObjectId(listingId);
    } catch {
      return NextResponse.json({ error: "Invalid listing ID format." }, { status: 400 });
    }

    const listing = await db.collection("cropListings").findOne({ _id: parsedListingId });
    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    await db.collection("marketplaceReports").insertOne({
      reporterUserId: user.id,
      reporterName: user.name,
      reporterEmail: user.email,
      listingId: parsedListingId,
      cropName: listing.cropName,
      farmerId: listing.farmerId,
      farmerName: listing.farmerName,
      reason,
      details: details ? String(details).trim().slice(0, 500) : "",
      status: "pending", // "pending", "under_review", "resolved", "dismissed"
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Your report has been submitted to the FarmWise moderation team for review.",
    });
  } catch (error) {
    console.error("Submit report failed:", error);
    return NextResponse.json({ error: "Failed to submit report." }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { session, user, error } = await requireAuth(request, ["admin"]);
    if (error) return error;

    const reports = await db
      .collection("marketplaceReports")
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({
      reports: reports.map((r) => ({
        ...r,
        _id: r._id.toString(),
        listingId: r.listingId ? r.listingId.toString() : null,
      })),
    });
  } catch (error) {
    console.error("Fetch reports failed:", error);
    return NextResponse.json({ error: "Failed to load reports." }, { status: 500 });
  }
}
