import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";

export async function GET(request) {
  try {
    const { session, user, error } = await requireAuth(request, ["admin"]);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const status = searchParams.get("status")?.trim().toLowerCase() || "";
    const category = searchParams.get("category")?.trim().toLowerCase() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    const skip = (page - 1) * limit;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (category) {
      query.cropCategory = category;
    }

    if (q) {
      query.$or = [
        { cropName: { $regex: new RegExp(q, "i") } },
        { variety: { $regex: new RegExp(q, "i") } },
        { farmerName: { $regex: new RegExp(q, "i") } },
        { district: { $regex: new RegExp(q, "i") } },
        { state: { $regex: new RegExp(q, "i") } },
      ];
    }

    const [listings, total] = await Promise.all([
      db
        .collection("cropListings")
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("cropListings").countDocuments(query),
    ]);

    return NextResponse.json({
      listings: listings.map((l) => ({
        ...l,
        _id: l._id.toString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error("Admin list crop listings failed:", error);
    return NextResponse.json({ error: "Failed to load listings." }, { status: 500 });
  }
}
