import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";

export async function POST(request) {
  try {
    const { session, user, error } = await requireAuth(request, ["admin"]);
    if (error) return error;

    const body = await request.json();
    const { slug, name, icon, popularCrops, order, isActive } = body;

    if (!slug || !name) {
      return NextResponse.json({ error: "Category slug and name are required." }, { status: 400 });
    }

    const cleanSlug = String(slug).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");

    await db.collection("cropCategories").updateOne(
      { slug: cleanSlug },
      {
        $set: {
          slug: cleanSlug,
          name: typeof name === "object" ? name : { en: String(name).trim() },
          icon: icon ? String(icon).trim() : "🌱",
          popularCrops: Array.isArray(popularCrops) ? popularCrops : [],
          order: Number.isFinite(Number(order)) ? Number(order) : 10,
          isActive: isActive !== false,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: `Category "${cleanSlug}" saved successfully.`,
    });
  } catch (error) {
    console.error("Save category failed:", error);
    return NextResponse.json({ error: "Failed to save category." }, { status: 500 });
  }
}
