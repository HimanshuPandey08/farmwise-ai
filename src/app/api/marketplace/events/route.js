import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { getOptionalSession } from "@/lib/rbac";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const body = await request.json();
    const { listingId, eventType } = body;

    const validEvents = ["view", "phone_click", "whatsapp_click", "save"];
    if (!listingId || !validEvents.includes(eventType)) {
      return NextResponse.json({ error: "Invalid event data." }, { status: 400 });
    }

    let parsedListingId;
    try {
      parsedListingId = new ObjectId(listingId);
    } catch {
      return NextResponse.json({ error: "Invalid listing ID format." }, { status: 400 });
    }

    const { session } = await getOptionalSession(request);
    const actorId = session?.user?.id || null;

    // Deduplication check: ignore identical event within 15 seconds from same user
    const recentWindow = new Date(Date.now() - 15000);
    if (actorId) {
      const recentEvent = await db.collection("listingEvents").findOne({
        listingId: parsedListingId,
        eventType,
        actorId,
        createdAt: { $gte: recentWindow },
      });

      if (recentEvent) {
        return NextResponse.json({ recorded: false, deduplicated: true });
      }
    }

    // Atomically increment counter on crop listing
    const incField = {};
    if (eventType === "phone_click") incField.phoneClicksCount = 1;
    else if (eventType === "whatsapp_click") incField.whatsappClicksCount = 1;
    else if (eventType === "view") incField.viewsCount = 1;

    if (Object.keys(incField).length > 0) {
      await db.collection("cropListings").updateOne(
        { _id: parsedListingId },
        { $inc: incField }
      );
    }

    // Persist event in listingEvents collection
    await db.collection("listingEvents").insertOne({
      listingId: parsedListingId,
      eventType,
      actorId,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, recorded: true });
  } catch (error) {
    console.error("Record listing event failed:", error);
    return NextResponse.json({ error: "Failed to record event." }, { status: 500 });
  }
}
