import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";

export async function GET(request) {
  try {
    const { session, user, error } = await requireAuth(request, ["admin"]);
    if (error) return error;

    // Platform KPIs
    const [
      totalUsers,
      totalFarmers,
      totalBuyers,
      totalAdmins,
      suspendedUsers,
      activeListings,
      expiredListings,
      totalReports,
      pendingReports,
    ] = await Promise.all([
      db.collection("user").countDocuments({}),
      db.collection("user").countDocuments({ role: "farmer" }),
      db.collection("user").countDocuments({ role: "buyer" }),
      db.collection("user").countDocuments({ role: "admin" }),
      db.collection("user").countDocuments({ isSuspended: true }),
      db.collection("cropListings").countDocuments({ status: "active" }),
      db.collection("cropListings").countDocuments({ status: "expired" }),
      db.collection("marketplaceReports").countDocuments({}),
      db.collection("marketplaceReports").countDocuments({ status: "pending" }),
    ]);

    // Aggregate total quantity & engagement stats across active listings
    const activeAggregation = await db
      .collection("cropListings")
      .aggregate([
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: "$normalizedQuantity" },
            totalViews: { $sum: "$viewsCount" },
            totalPhoneClicks: { $sum: "$phoneClicksCount" },
            totalWhatsappClicks: { $sum: "$whatsappClicksCount" },
          },
        },
      ])
      .toArray();

    const aggMetrics = activeAggregation[0] || {
      totalQuantity: 0,
      totalViews: 0,
      totalPhoneClicks: 0,
      totalWhatsappClicks: 0,
    };

    // Category distribution
    const categoryDistribution = await db
      .collection("cropListings")
      .aggregate([
        { $match: { status: "active" } },
        { $group: { _id: "$cropCategory", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray();

    // State distribution
    const stateDistribution = await db
      .collection("cropListings")
      .aggregate([
        { $match: { status: "active" } },
        { $group: { _id: "$state", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    return NextResponse.json({
      metrics: {
        totalUsers,
        totalFarmers,
        totalBuyers,
        totalAdmins,
        suspendedUsers,
        activeListings,
        expiredListings,
        totalQuantityQuintals: aggMetrics.totalQuantity,
        totalViews: aggMetrics.totalViews,
        totalPhoneClicks: aggMetrics.totalPhoneClicks,
        totalWhatsappClicks: aggMetrics.totalWhatsappClicks,
        totalReports,
        pendingReports,
      },
      categoryDistribution: categoryDistribution.map((c) => ({
        category: c._id,
        count: c.count,
      })),
      stateDistribution: stateDistribution.map((s) => ({
        state: s._id,
        count: s.count,
      })),
    });
  } catch (error) {
    console.error("Admin stats failed:", error);
    return NextResponse.json({ error: "Failed to load platform analytics." }, { status: 500 });
  }
}
