import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/mongodb";
import { isValidState, isValidDistrict } from "@/lib/india-locations";

export async function GET(request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const role = (session.user.role || "farmer").toLowerCase();

    let profile = null;

    if (role === "buyer") {
      profile = await db.collection("buyerProfiles").findOne(
        { userId },
        { projection: { _id: 0, userId: 0 } }
      );
    } else {
      profile = await db.collection("farmerProfiles").findOne(
        { userId },
        { projection: { _id: 0, userId: 0 } }
      );
    }

    return NextResponse.json({
      role,
      user: {
        name: session.user.name,
        email: session.user.email,
        phone: session.user.phone || profile?.phone || "",
        role,
        image: session.user.image || null,
        createdAt: session.user.createdAt,
      },
      profile: profile || {},
    });
  } catch (error) {
    console.error("Get profile failed:", error);
    return NextResponse.json(
      { error: "Unable to retrieve profile." },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const role = (session.user.role || "farmer").toLowerCase();
    const body = await request.json();

    // Prevent changing the user's role through profile update
    if (body.role && body.role !== role) {
      return NextResponse.json(
        { error: "Role cannot be modified through profile settings." },
        { status: 403 }
      );
    }

    // Name update if provided
    if (body.name && typeof body.name === "string" && body.name.trim().length >= 2) {
      await db.collection("user").updateOne(
        { _id: typeof userId === "string" && userId.length === 24 ? new (await import("mongodb")).ObjectId(userId) : userId },
        { $set: { name: body.name.trim(), updatedAt: new Date() } }
      );
    }

    // Validate phone number if provided
    if (body.phone !== undefined) {
      const cleanPhone = String(body.phone).replace(/\D/g, "");
      if (cleanPhone && cleanPhone.length !== 10) {
        return NextResponse.json(
          { error: "Phone number must be a valid 10-digit mobile number." },
          { status: 400 }
        );
      }
    }

    if (role === "buyer") {
      const allowedBuyerFields = [
        "phone",
        "businessName",
        "businessCategory",
        "gstin",
        "district",
        "state",
        "deliveryAddress",
        "businessDescription",
        "avatarUrl"
      ];

      const buyerData = {};
      for (const field of allowedBuyerFields) {
        if (body[field] !== undefined) {
          if (typeof body[field] !== "string" || body[field].length > 500) {
            return NextResponse.json(
              { error: `Invalid value for ${field}.` },
              { status: 400 }
            );
          }
          buyerData[field] = body[field].trim();
        }
      }

      // Validate location if provided
      if (buyerData.state && !isValidState(buyerData.state)) {
        return NextResponse.json(
          { error: "Please select a valid Indian state." },
          { status: 400 }
        );
      }

      await db.collection("buyerProfiles").updateOne(
        { userId },
        {
          $set: {
            ...buyerData,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            userId,
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      // Keep user record phone in sync
      if (buyerData.phone) {
        await db.collection("user").updateOne(
          { _id: typeof userId === "string" && userId.length === 24 ? new (await import("mongodb")).ObjectId(userId) : userId },
          { $set: { phone: buyerData.phone } }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Buyer profile saved successfully.",
      });
    }

    // Farmer Profile
    const allowedFarmerFields = [
      "phone",
      "village",
      "district",
      "state",
      "farmSize",
      "soilType",
      "fpoName",
      "about",
      "avatarUrl"
    ];

    const farmerData = {};
    for (const field of allowedFarmerFields) {
      if (body[field] !== undefined) {
        if (typeof body[field] !== "string" || body[field].length > 500) {
          return NextResponse.json(
            { error: `Invalid value for ${field}.` },
            { status: 400 }
          );
        }
        farmerData[field] = body[field].trim();
      }
    }

    // Validate location if provided
    if (farmerData.state && !isValidState(farmerData.state)) {
      return NextResponse.json(
        { error: "Please select a valid Indian state." },
        { status: 400 }
      );
    }

    await db.collection("farmerProfiles").updateOne(
      { userId },
      {
        $set: {
          ...farmerData,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          userId,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    // Keep user record phone in sync
    if (farmerData.phone) {
      await db.collection("user").updateOne(
        { _id: typeof userId === "string" && userId.length === 24 ? new (await import("mongodb")).ObjectId(userId) : userId },
        { $set: { phone: farmerData.phone } }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Farmer profile saved successfully.",
    });
  } catch (error) {
    console.error("Save profile failed:", error);
    return NextResponse.json(
      { error: "Unable to save profile." },
      { status: 500 }
    );
  }
}
