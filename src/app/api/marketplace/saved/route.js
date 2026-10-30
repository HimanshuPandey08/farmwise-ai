import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const { session, user, error } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const { listingId } = body;

    if (!listingId) {
      return NextResponse.json({ error: "Listing ID is required." }, { status: 400 });
    }

    let query;
    try {
      query = { _id: new ObjectId(listingId) };
    } catch {
      return NextResponse.json({ error: "Invalid listing ID format." }, { status: 400 });
    }

    const listing = await db.collection("cropListings").findOne(query);
    if (!listing) {
      return NextResponse.json({ error: "Crop listing not found." }, { status: 404 });
    }

    // Upsert into savedListings
    await db.collection("savedListings").updateOne(
      {
        buyerId: user.id,
        listingId: listing._id,
      },
      {
        $setOnInsert: {
          buyerId: user.id,
          listingId: listing._id,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    // Increment savesCount on listing
    await db.collection("cropListings").updateOne(
      { _id: listing._id },
      { $inc: { savesCount: 1 } }
    );

    return NextResponse.json({
      success: true,
      message: "Listing saved to your favourites.",
    });
  } catch (error) {
    console.error("Save listing failed:", error);
    return NextResponse.json({ error: "Failed to save listing." }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { session, user, error } = await requireAuth(request);
    if (error) return error;

    const savedRecords = await db
      .collection("savedListings")
      .find({ buyerId: user.id })
      .sort({ createdAt: -1 })
      .toArray();

    if (savedRecords.length === 0) {
      return NextResponse.json({ savedListings: [] });
    }

    const listingIds = savedRecords.map((r) => r.listingId);

    const listings = await db
      .collection("cropListings")
      .find({
        _id: { $in: listingIds },
        status: { $ne: "removed" },
      })
      .toArray();

    const listingsMap = new Map();
    for (const item of listings) {
      listingsMap.set(item._id.toString(), {
        ...item,
        _id: item._id.toString(),
      });
    }

    // Preserve saved order
    const result = [];
    for (const record of savedRecords) {
      const listingData = listingsMap.get(record.listingId.toString());
      if (listingData) {
        result.push({
          savedId: record._id.toString(),
          savedAt: record.createdAt,
          ...listingData,
        });
      }
    }

    return NextResponse.json({ savedListings: result });
  } catch (error) {
    console.error("Fetch saved listings failed:", error);
    return NextResponse.json({ error: "Failed to load saved listings." }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { session, user, error } = await requireAuth(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId");

    if (!listingId) {
      return NextResponse.json({ error: "Listing ID is required." }, { status: 400 });
    }

    let parsedId;
    try {
      parsedId = new ObjectId(listingId);
    } catch {
      return NextResponse.json({ error: "Invalid listing ID format." }, { status: 400 });
    }

    await db.collection("savedListings").deleteOne({
      buyerId: user.id,
      listingId: parsedId,
    });

    return NextResponse.json({
      success: true,
      message: "Listing removed from favourites.",
    });
  } catch (error) {
    console.error("Remove saved listing failed:", error);
    return NextResponse.json({ error: "Failed to remove saved listing." }, { status: 500 });
  }
}
