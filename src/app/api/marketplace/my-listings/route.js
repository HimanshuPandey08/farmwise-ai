import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";

export async function GET(request) {
  try {
    const { session, user, error } = await requireAuth(request, ["farmer", "admin"]);
    if (error) return error;

    const listings = await db
      .collection("cropListings")
      .find({
        farmerId: user.id,
        status: { $ne: "removed" },
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Calculate farmer summary metrics
    let totalQuantity = 0;
    let totalViews = 0;
    let totalPhoneClicks = 0;
    let totalWhatsappClicks = 0;
    const statusCounts = {
      active: 0,
      sold_out: 0,
      temporarily_unavailable: 0,
      expired: 0,
    };

    const now = new Date();

    const formattedListings = listings.map((l) => {
      let currentStatus = l.status;
      if (l.expiresAt && new Date(l.expiresAt) < now && l.status === "active") {
        currentStatus = "expired";
      }

      if (currentStatus === "active") {
        totalQuantity += l.normalizedQuantity || 0;
      }

      totalViews += l.viewsCount || 0;
      totalPhoneClicks += l.phoneClicksCount || 0;
      totalWhatsappClicks += l.whatsappClicksCount || 0;

      if (statusCounts[currentStatus] !== undefined) {
        statusCounts[currentStatus]++;
      }

      return {
        ...l,
        _id: l._id.toString(),
        status: currentStatus,
      };
    });

    return NextResponse.json({
      listings: formattedListings,
      metrics: {
        totalListings: formattedListings.length,
        activeListings: statusCounts.active,
        totalActiveQuantityQuintals: totalQuantity,
        totalViews,
        totalPhoneClicks,
        totalWhatsappClicks,
        statusDistribution: statusCounts,
      },
    });
  } catch (error) {
    console.error("Fetch my listings failed:", error);
    return NextResponse.json({ error: "Failed to load your listings." }, { status: 500 });
  }
}
