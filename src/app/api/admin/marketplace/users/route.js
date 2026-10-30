import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { ObjectId } from "mongodb";

export async function GET(request) {
  try {
    const { session, user, error } = await requireAuth(request, ["admin"]);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const role = searchParams.get("role")?.trim().toLowerCase() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const query = {};
    if (role) {
      query.role = role;
    }

    if (q) {
      query.$or = [
        { name: { $regex: new RegExp(q, "i") } },
        { email: { $regex: new RegExp(q, "i") } },
        { phone: { $regex: new RegExp(q, "i") } },
      ];
    }

    const [users, total] = await Promise.all([
      db
        .collection("user")
        .find(query, {
          projection: {
            name: 1,
            email: 1,
            role: 1,
            phone: 1,
            isSuspended: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("user").countDocuments(query),
    ]);

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        _id: u._id.toString(),
        role: u.role || "farmer",
        isSuspended: Boolean(u.isSuspended),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error("Admin list users failed:", error);
    return NextResponse.json({ error: "Failed to load users." }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { session, user, error } = await requireAuth(request, ["admin"]);
    if (error) return error;

    const body = await request.json();
    const { targetUserId, action, reason } = body;

    if (!targetUserId || !action) {
      return NextResponse.json({ error: "Target user ID and action are required." }, { status: 400 });
    }

    let parsedId;
    try {
      parsedId = new ObjectId(targetUserId);
    } catch {
      return NextResponse.json({ error: "Invalid user ID format." }, { status: 400 });
    }

    const targetUser = await db.collection("user").findOne({ _id: parsedId });
    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found." }, { status: 404 });
    }

    // Prevent suspending oneself
    if (targetUser._id.toString() === user.id && (action === "suspend" || action === "demote")) {
      return NextResponse.json({ error: "You cannot suspend or demote your own admin account." }, { status: 400 });
    }

    const updates = { updatedAt: new Date() };

    if (action === "suspend") {
      updates.isSuspended = true;
    } else if (action === "reactivate") {
      updates.isSuspended = false;
    } else if (action === "promote_admin") {
      updates.role = "admin";
    } else if (action === "set_role" && (body.newRole === "farmer" || body.newRole === "buyer")) {
      updates.role = body.newRole;
    } else {
      return NextResponse.json({ error: "Invalid admin user action." }, { status: 400 });
    }

    await db.collection("user").updateOne({ _id: parsedId }, { $set: updates });

    // Record audit trail
    await db.collection("adminAuditTrail").insertOne({
      adminId: user.id,
      adminName: user.name,
      targetUserId: targetUser._id.toString(),
      targetUserEmail: targetUser.email,
      action,
      reason: reason ? String(reason).trim() : "",
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.name} updated successfully (${action}).`,
    });
  } catch (error) {
    console.error("Admin user action failed:", error);
    return NextResponse.json({ error: "Failed to perform user action." }, { status: 500 });
  }
}
