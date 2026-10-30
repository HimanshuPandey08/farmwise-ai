import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not found.");
  process.exit(1);
}

const client = new MongoClient(uri);

async function setupIndexes() {
  try {
    await client.connect();
    const db = client.db("farmwise_ai");
    console.log("Connected to MongoDB Atlas: farmwise_ai");

    // 1. cropListings
    console.log("Indexing 'cropListings'...");
    await db.collection("cropListings").createIndexes([
      { key: { status: 1, expiresAt: 1, createdAt: -1 }, name: "status_expiry_idx" },
      { key: { farmerId: 1, createdAt: -1 }, name: "farmer_listings_idx" },
      { key: { cropCategory: 1, status: 1 }, name: "category_status_idx" },
      { key: { state: 1, district: 1 }, name: "location_idx" },
      { key: { pricePerQuintal: 1 }, name: "price_idx" },
      { key: { normalizedQuantity: 1 }, name: "quantity_idx" },
    ]);

    // 2. savedListings
    console.log("Indexing 'savedListings'...");
    await db.collection("savedListings").createIndexes([
      { key: { userId: 1, listingId: 1 }, unique: true, name: "user_listing_unique_idx" },
      { key: { userId: 1, createdAt: -1 }, name: "user_saved_idx" },
    ]);

    // 3. savedSearches
    console.log("Indexing 'savedSearches'...");
    await db.collection("savedSearches").createIndexes([
      { key: { userId: 1, createdAt: -1 }, name: "user_searches_idx" },
    ]);

    // 4. listingEvents
    console.log("Indexing 'listingEvents'...");
    await db.collection("listingEvents").createIndexes([
      { key: { listingId: 1, eventType: 1, createdAt: -1 }, name: "event_listing_idx" },
      { key: { userId: 1, eventType: 1, createdAt: -1 }, name: "event_user_idx" },
    ]);

    // 5. marketplaceNotifications
    console.log("Indexing 'marketplaceNotifications'...");
    await db.collection("marketplaceNotifications").createIndexes([
      { key: { recipientUserId: 1, isRead: 1, createdAt: -1 }, name: "notifications_user_idx" },
    ]);

    // 6. marketplaceReports
    console.log("Indexing 'marketplaceReports'...");
    await db.collection("marketplaceReports").createIndexes([
      { key: { status: 1, createdAt: -1 }, name: "reports_status_idx" },
      { key: { listingId: 1 }, name: "reports_listing_idx" },
    ]);

    // 7. adminAuditTrail
    console.log("Indexing 'adminAuditTrail'...");
    await db.collection("adminAuditTrail").createIndexes([
      { key: { adminId: 1, createdAt: -1 }, name: "audit_admin_idx" },
    ]);

    console.log("✅ All marketplace MongoDB collections indexed successfully!");
  } finally {
    await client.close();
  }
}

setupIndexes().catch((err) => {
  console.error("Index setup failed:", err);
  process.exit(1);
});
