import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const { session, user, error } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const {
      title,
      cropName,
      category,
      state,
      district,
      minPrice,
      maxPrice,
      minQuantity,
      maxQuantity,
    } = body;

    const searchTitle = title
      ? String(title).trim().slice(0, 100)
      : `${cropName || category || "All Crops"} in ${district || state || "India"}`;

    const doc = {
      buyerId: user.id,
      title: searchTitle,
      filters: {
        cropName: cropName ? String(cropName).trim() : "",
        category: category ? String(category).trim().toLowerCase() : "",
        state: state ? String(state).trim() : "",
        district: district ? String(district).trim() : "",
        minPrice: Number.isFinite(Number(minPrice)) ? Number(minPrice) : null,
        maxPrice: Number.isFinite(Number(maxPrice)) ? Number(maxPrice) : null,
        minQuantity: Number.isFinite(Number(minQuantity)) ? Number(minQuantity) : null,
        maxQuantity: Number.isFinite(Number(maxQuantity)) ? Number(maxQuantity) : null,
      },
      createdAt: new Date(),
    };

    const result = await db.collection("savedSearches").insertOne(doc);

    return NextResponse.json({
      success: true,
      message: "Search alert saved successfully.",
      id: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("Save search alert failed:", error);
    return NextResponse.json({ error: "Failed to save search alert." }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { session, user, error } = await requireAuth(request);
    if (error) return error;

    const searches = await db
      .collection("savedSearches")
      .find({ buyerId: user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      savedSearches: searches.map((s) => ({
        ...s,
        _id: s._id.toString(),
      })),
    });
  } catch (error) {
    console.error("Fetch saved searches failed:", error);
    return NextResponse.json({ error: "Failed to load saved searches." }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { session, user, error } = await requireAuth(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Search ID is required." }, { status: 400 });
    }

    let parsedId;
    try {
      parsedId = new ObjectId(id);
    } catch {
      return NextResponse.json({ error: "Invalid ID format." }, { status: 400 });
    }

    await db.collection("savedSearches").deleteOne({
      _id: parsedId,
      buyerId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Saved search removed.",
    });
  } catch (error) {
    console.error("Delete saved search failed:", error);
    return NextResponse.json({ error: "Failed to remove saved search." }, { status: 500 });
  }
}
