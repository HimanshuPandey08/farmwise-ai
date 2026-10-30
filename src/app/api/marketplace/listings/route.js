import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { isValidState, isValidDistrict } from "@/lib/india-locations";
import { getCategoryBySlug } from "@/lib/crop-categories";

const DEFAULT_EXPIRY_DAYS = 30;

export async function POST(request) {
  try {
    const { session, user, error } = await requireAuth(request, ["farmer", "admin"]);
    if (error) return error;

    const body = await request.json();
    const {
      cropName,
      cropCategory,
      quantity,
      unit,
      pricePerQuintal,
      state,
      district,
      village,
      images,
      variety,
      grade,
      moisturePercent,
      harvestDate,
      packagingType,
      storageInfo,
      deliveryArrangements,
      description,
      pickupLocation,
      partialPurchaseAllowed,
      minimumOrderQuantity,
      linkedDiagnosisId,
    } = body;

    // Validate Required Fields
    if (!cropName || typeof cropName !== "string" || cropName.trim().length < 2) {
      return NextResponse.json({ error: "Crop name is required (at least 2 characters)." }, { status: 400 });
    }

    if (!cropCategory || typeof cropCategory !== "string") {
      return NextResponse.json({ error: "Please select a valid crop category." }, { status: 400 });
    }

    const numQuantity = Number(quantity);
    if (!Number.isFinite(numQuantity) || numQuantity <= 0) {
      return NextResponse.json({ error: "Please enter a valid positive quantity." }, { status: 400 });
    }

    const validUnits = ["Quintal", "Tonne"];
    const normalizedUnit = validUnits.includes(unit) ? unit : "Quintal";

    // 1 Tonne = 10 Quintals
    const normalizedQuantity = normalizedUnit === "Tonne" ? numQuantity * 10 : numQuantity;

    const numPrice = Number(pricePerQuintal);
    if (!Number.isFinite(numPrice) || numPrice <= 0) {
      return NextResponse.json({ error: "Please enter a valid price per quintal (INR)." }, { status: 400 });
    }

    if (!state || !isValidState(state)) {
      return NextResponse.json({ error: "Please select a recognized Indian state." }, { status: 400 });
    }

    if (!district || !isValidDistrict(state, district)) {
      return NextResponse.json({ error: `District "${district}" is not valid for state "${state}".` }, { status: 400 });
    }

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "Please provide at least one crop photograph." }, { status: 400 });
    }

    // Validate that each image URL is from Cloudinary
    for (const img of images) {
      const url = typeof img === "string" ? img : img?.secureUrl;
      if (!url || typeof url !== "string" || !url.startsWith("https://res.cloudinary.com/")) {
        return NextResponse.json({ error: "All images must be uploaded through Cloudinary." }, { status: 400 });
      }
    }

    // Get farmer profile details for phone number contact
    const farmerProfile = await db.collection("farmerProfiles").findOne({ userId: user.id });
    const sellerPhone = farmerProfile?.phone || user.phone || "";

    const now = new Date();
    const expiresAt = new Date(now.getTime() + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const listingDocument = {
      farmerId: user.id,
      farmerName: user.name,
      farmerPhone: sellerPhone,
      cropName: cropName.trim().slice(0, 100),
      cropCategory: cropCategory.trim().toLowerCase(),
      variety: variety ? String(variety).trim().slice(0, 100) : "",
      quantity: numQuantity,
      unit: normalizedUnit,
      normalizedQuantity, // Always in Quintals
      pricePerQuintal: numPrice,
      state: state.trim(),
      district: district.trim(),
      village: village ? String(village).trim().slice(0, 150) : "",
      images: images.slice(0, 5).map((img) => (typeof img === "string" ? { secureUrl: img } : img)),
      grade: grade ? String(grade).trim().slice(0, 50) : "Standard",
      moisturePercent: Number.isFinite(Number(moisturePercent)) ? Number(moisturePercent) : null,
      harvestDate: harvestDate ? new Date(harvestDate) : null,
      packagingType: packagingType ? String(packagingType).trim().slice(0, 100) : "",
      storageInfo: storageInfo ? String(storageInfo).trim().slice(0, 200) : "",
      deliveryArrangements: deliveryArrangements ? String(deliveryArrangements).trim().slice(0, 200) : "",
      description: description ? String(description).trim().slice(0, 1000) : "",
      pickupLocation: pickupLocation ? String(pickupLocation).trim().slice(0, 200) : "",
      partialPurchaseAllowed: partialPurchaseAllowed !== false,
      minimumOrderQuantity: Number.isFinite(Number(minimumOrderQuantity)) && Number(minimumOrderQuantity) > 0
        ? Number(minimumOrderQuantity)
        : 1,
      linkedDiagnosisId: linkedDiagnosisId ? String(linkedDiagnosisId) : null,
      status: "active", // "active", "temporarily_unavailable", "partially_sold", "sold_out", "expired", "removed"
      viewsCount: 0,
      uniqueViewsCount: 0,
      phoneClicksCount: 0,
      whatsappClicksCount: 0,
      savesCount: 0,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("cropListings").insertOne(listingDocument);

    // Update farmer profile totalListingsCount cache
    await db.collection("farmerProfiles").updateOne(
      { userId: user.id },
      { $inc: { totalListingsCount: 1 } }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Crop produce listing published successfully.",
        listingId: result.insertedId.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create crop listing failed:", error);
    return NextResponse.json({ error: "Failed to create crop listing." }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Filter parameters
    const q = searchParams.get("q")?.trim() || "";
    const category = searchParams.get("category")?.trim().toLowerCase() || "";
    const cropName = searchParams.get("cropName")?.trim() || "";
    const variety = searchParams.get("variety")?.trim() || "";
    const state = searchParams.get("state")?.trim() || "";
    const district = searchParams.get("district")?.trim() || "";
    const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : null;
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : null;
    const minQuantity = searchParams.get("minQuantity") ? Number(searchParams.get("minQuantity")) : null;
    const maxQuantity = searchParams.get("maxQuantity") ? Number(searchParams.get("maxQuantity")) : null;
    const grade = searchParams.get("grade")?.trim() || "";
    const sort = searchParams.get("sort") || "newest";

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const skip = (page - 1) * limit;

    // Base query: Only active listings with unexpired date
    const query = {
      status: "active",
      expiresAt: { $gt: new Date() },
    };

    if (category) {
      query.cropCategory = category;
    }

    if (cropName) {
      query.cropName = { $regex: new RegExp(cropName, "i") };
    }

    if (variety) {
      query.variety = { $regex: new RegExp(variety, "i") };
    }

    if (state) {
      query.state = state;
    }

    if (district) {
      query.district = district;
    }

    if (grade) {
      query.grade = grade;
    }

    if (minPrice !== null || maxPrice !== null) {
      query.pricePerQuintal = {};
      if (minPrice !== null && !isNaN(minPrice)) query.pricePerQuintal.$gte = minPrice;
      if (maxPrice !== null && !isNaN(maxPrice)) query.pricePerQuintal.$lte = maxPrice;
    }

    if (minQuantity !== null || maxQuantity !== null) {
      query.normalizedQuantity = {};
      if (minQuantity !== null && !isNaN(minQuantity)) query.normalizedQuantity.$gte = minQuantity;
      if (maxQuantity !== null && !isNaN(maxQuantity)) query.normalizedQuantity.$lte = maxQuantity;
    }

    if (q) {
      query.$or = [
        { cropName: { $regex: new RegExp(q, "i") } },
        { variety: { $regex: new RegExp(q, "i") } },
        { state: { $regex: new RegExp(q, "i") } },
        { district: { $regex: new RegExp(q, "i") } },
        { farmerName: { $regex: new RegExp(q, "i") } },
      ];
    }

    // Sort definition
    let sortObj = { createdAt: -1 };
    if (sort === "price_asc") sortObj = { pricePerQuintal: 1 };
    else if (sort === "price_desc") sortObj = { pricePerQuintal: -1 };
    else if (sort === "quantity_desc") sortObj = { normalizedQuantity: -1 };

    const [listings, total] = await Promise.all([
      db
        .collection("cropListings")
        .find(query, {
          projection: {
            farmerPhone: 0, // Keep phone hidden on public list view
          },
        })
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("cropListings").countDocuments(query),
    ]);

    return NextResponse.json({
      listings: listings.map((l) => ({ ...l, _id: l._id.toString() })),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error("Fetch marketplace listings failed:", error);
    return NextResponse.json({ error: "Failed to fetch crop listings." }, { status: 500 });
  }
}
