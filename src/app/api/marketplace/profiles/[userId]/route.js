import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { getOptionalSession } from "@/lib/rbac";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  try {
    const { userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    let userQuery;
    try {
      userQuery = { _id: new ObjectId(userId) };
    } catch {
      userQuery = { id: userId };
    }

    const user = await db.collection("user").findOne(userQuery, {
      projection: {
        _id: 1,
        name: 1,
        image: 1,
        role: 1,
        phone: 1,
        createdAt: 1,
        isSuspended: 1,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }

    const stringUserId = user._id.toString();
    const role = (user.role || "farmer").toLowerCase();

    // Check viewer session (logged in users can view phone)
    const { session } = await getOptionalSession(request);
    const isAuthenticated = Boolean(session && session.user);

    let profileDetails = {};
    let activeListings = [];

    if (role === "buyer") {
      const buyerProfile = await db.collection("buyerProfiles").findOne(
        { userId: stringUserId },
        {
          projection: {
            _id: 0,
            userId: 0,
            deliveryAddress: 0, // Keep private address hidden
          },
        }
      );

      profileDetails = buyerProfile || {};
    } else {
      // Farmer profile
      const farmerProfile = await db.collection("farmerProfiles").findOne(
        { userId: stringUserId },
        {
          projection: {
            _id: 0,
            userId: 0,
          },
        }
      );

      profileDetails = farmerProfile || {};

      // Get active crop listings
      activeListings = await db
        .collection("cropListings")
        .find({
          farmerId: stringUserId,
          status: "active",
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray();
    }

    // Sanitize phone if not authenticated
    const publicPhone = isAuthenticated
      ? (profileDetails.phone || user.phone || "")
      : "";

    return NextResponse.json({
      profile: {
        userId: stringUserId,
        name: user.name,
        role,
        memberSince: user.createdAt,
        image: user.image || profileDetails.avatarUrl || null,
        phone: publicPhone,
        isAuthenticatedViewer: isAuthenticated,
        ...profileDetails,
        phone: publicPhone,
      },
      activeListings: activeListings.map((item) => ({
        ...item,
        _id: item._id.toString(),
      })),
    });
  } catch (error) {
    console.error("Fetch public profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile." },
      { status: 500 }
    );
  }
}
