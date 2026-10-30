import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { requireAuth, getOptionalSession } from "@/lib/rbac";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Listing ID is required." }, { status: 400 });
    }

    let query;
    try {
      query = { _id: new ObjectId(id) };
    } catch {
      return NextResponse.json({ error: "Invalid listing ID format." }, { status: 400 });
    }

    const listing = await db.collection("cropListings").findOne(query);
    if (!listing) {
      return NextResponse.json({ error: "Produce listing not found." }, { status: 404 });
    }

    // Check if listing has expired
    const isExpired = listing.expiresAt && new Date(listing.expiresAt) < new Date();
    if (isExpired && listing.status === "active") {
      await db.collection("cropListings").updateOne(
        { _id: listing._id },
        { $set: { status: "expired", updatedAt: new Date() } }
      );
      listing.status = "expired";
    }

    // Increment view count
    await db.collection("cropListings").updateOne(
      { _id: listing._id },
      { $inc: { viewsCount: 1 } }
    );

    // Check authentication of viewer
    const { session } = await getOptionalSession(request);
    const isAuthenticated = Boolean(session && session.user);

    // Fetch seller profile details
    const farmerProfile = await db.collection("farmerProfiles").findOne(
      { userId: listing.farmerId },
      {
        projection: {
          village: 1,
          district: 1,
          state: 1,
          fpoName: 1,
          about: 1,
          phone: 1,
        },
      }
    );

    // Reveal phone only to authenticated users
    const phoneToDisplay = isAuthenticated
      ? (listing.farmerPhone || farmerProfile?.phone || "")
      : "";

    // Fetch rule-based matching similar produce (same category or state)
    const similarListings = await db
      .collection("cropListings")
      .find(
        {
          _id: { $ne: listing._id },
          status: "active",
          expiresAt: { $gt: new Date() },
          $or: [
            { cropName: listing.cropName },
            { cropCategory: listing.cropCategory },
            { district: listing.district },
          ],
        },
        {
          projection: {
            farmerPhone: 0,
          },
        }
      )
      .limit(4)
      .toArray();

    return NextResponse.json({
      listing: {
        ...listing,
        _id: listing._id.toString(),
        farmerPhone: phoneToDisplay,
        isAuthenticatedViewer: isAuthenticated,
      },
      seller: {
        name: listing.farmerName,
        phone: phoneToDisplay,
        village: farmerProfile?.village || listing.village || "",
        district: listing.district,
        state: listing.state,
        fpoName: farmerProfile?.fpoName || "",
        about: farmerProfile?.about || "",
      },
      similarListings: similarListings.map((l) => ({ ...l, _id: l._id.toString() })),
    });
  } catch (error) {
    console.error("Get single listing failed:", error);
    return NextResponse.json({ error: "Failed to load listing." }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { session, user, role, error } = await requireAuth(request);
    if (error) return error;

    const { id } = await params;
    let query;
    try {
      query = { _id: new ObjectId(id) };
    } catch {
      return NextResponse.json({ error: "Invalid listing ID format." }, { status: 400 });
    }

    const listing = await db.collection("cropListings").findOne(query);
    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    // Authorization: Owner or Admin
    if (listing.farmerId !== user.id && role !== "admin") {
      return NextResponse.json({ error: "Forbidden. You can only edit your own listings." }, { status: 403 });
    }

    const body = await request.json();
    const updateFields = { updatedAt: new Date() };

    // Editable fields
    if (body.pricePerQuintal !== undefined) {
      const p = Number(body.pricePerQuintal);
      if (Number.isFinite(p) && p > 0) updateFields.pricePerQuintal = p;
    }

    if (body.quantity !== undefined) {
      const q = Number(body.quantity);
      if (Number.isFinite(q) && q > 0) {
        updateFields.quantity = q;
        const currentUnit = listing.unit || "Quintal";
        updateFields.normalizedQuantity = currentUnit === "Tonne" ? q * 10 : q;
      }
    }

    if (body.status !== undefined) {
      const validStatuses = [
        "active",
        "temporarily_unavailable",
        "partially_sold",
        "sold_out",
        "expired",
        "removed",
      ];
      if (validStatuses.includes(body.status)) {
        updateFields.status = body.status;
      }
    }

    if (body.description !== undefined && typeof body.description === "string") {
      updateFields.description = body.description.trim().slice(0, 1000);
    }

    if (body.renewListing === true) {
      // Renew for another 30 days
      updateFields.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      updateFields.status = "active";
    }

    if (Array.isArray(body.images) && body.images.length > 0) {
      updateFields.images = body.images.slice(0, 5);
    }

    await db.collection("cropListings").updateOne(query, { $set: updateFields });

    return NextResponse.json({
      success: true,
      message: "Listing updated successfully.",
    });
  } catch (error) {
    console.error("Update listing failed:", error);
    return NextResponse.json({ error: "Failed to update listing." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { session, user, role, error } = await requireAuth(request);
    if (error) return error;

    const { id } = await params;
    let query;
    try {
      query = { _id: new ObjectId(id) };
    } catch {
      return NextResponse.json({ error: "Invalid listing ID format." }, { status: 400 });
    }

    const listing = await db.collection("cropListings").findOne(query);
    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    // Authorization: Owner or Admin
    if (listing.farmerId !== user.id && role !== "admin") {
      return NextResponse.json({ error: "Forbidden. You can only remove your own listings." }, { status: 403 });
    }

    // Soft-delete: mark status as "removed"
    await db.collection("cropListings").updateOne(query, {
      $set: {
        status: "removed",
        removedAt: new Date(),
        removedBy: user.id,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Listing removed successfully.",
    });
  } catch (error) {
    console.error("Delete listing failed:", error);
    return NextResponse.json({ error: "Failed to remove listing." }, { status: 500 });
  }
}
