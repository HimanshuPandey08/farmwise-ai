import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { ObjectId } from "mongodb";

export async function PATCH(request, { params }) {
  try {
    const { session, user, error } = await requireAuth(request, ["admin"]);
    if (error) return error;

    const { id } = await params;
    let parsedId;
    try {
      parsedId = new ObjectId(id);
    } catch {
      return NextResponse.json({ error: "Invalid report ID format." }, { status: 400 });
    }

    const body = await request.json();
    const { status, adminNotes } = body;

    const validStatuses = ["pending", "under_review", "resolved", "dismissed"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid report status." }, { status: 400 });
    }

    await db.collection("marketplaceReports").updateOne(
      { _id: parsedId },
      {
        $set: {
          status,
          adminNotes: adminNotes ? String(adminNotes).trim() : "",
          resolvedBy: user.id,
          resolvedByName: user.name,
          resolvedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: `Report marked as "${status}".`,
    });
  } catch (error) {
    console.error("Update report status failed:", error);
    return NextResponse.json({ error: "Failed to update report." }, { status: 500 });
  }
}
