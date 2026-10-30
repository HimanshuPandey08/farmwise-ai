import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { INITIAL_CROP_CATEGORIES } from "@/lib/crop-categories";

export async function GET() {
  try {
    const categories = await db
      .collection("cropCategories")
      .find({ isActive: true })
      .sort({ order: 1 })
      .toArray();

    if (categories && categories.length > 0) {
      return NextResponse.json({
        categories: categories.map((c) => ({
          ...c,
          _id: c._id.toString(),
        })),
      });
    }

    // Resilient fallback to code-defined master data
    return NextResponse.json({ categories: INITIAL_CROP_CATEGORIES });
  } catch (error) {
    console.error("Fetch categories error:", error);
    return NextResponse.json({ categories: INITIAL_CROP_CATEGORIES });
  }
}
