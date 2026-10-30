import { db, client } from "../src/lib/mongodb.js";

async function migrateUserRoles() {
  console.log("Starting idempotent user role migration for FarmWise AI...");

  // 1. Check existing users
  const totalUsers = await db.collection("user").countDocuments();
  console.log(`Total existing user documents in database: ${totalUsers}`);

  // 2. Find users without a role
  const unassignedCount = await db.collection("user").countDocuments({
    role: { $exists: false }
  });
  console.log(`Users without role: ${unassignedCount}`);

  if (unassignedCount > 0) {
    const result = await db.collection("user").updateMany(
      { role: { $exists: false } },
      {
        $set: {
          role: "farmer",
          isSuspended: false,
          updatedAt: new Date()
        }
      }
    );
    console.log(`Updated ${result.modifiedCount} legacy user(s) with default role: 'farmer'.`);
  } else {
    console.log("All users already have a defined role. No changes required.");
  }

  // 3. Create or ensure indexes on user collection
  await db.collection("user").createIndex({ role: 1 });
  await db.collection("user").createIndex({ isSuspended: 1 });
  console.log("Verified indexes on 'user' collection ({ role: 1 }, { isSuspended: 1 }).");

  // 4. Verify post-migration state
  const farmersCount = await db.collection("user").countDocuments({ role: "farmer" });
  const buyersCount = await db.collection("user").countDocuments({ role: "buyer" });
  const adminsCount = await db.collection("user").countDocuments({ role: "admin" });
  console.log(`Current user distribution: ${farmersCount} farmer(s), ${buyersCount} buyer(s), ${adminsCount} admin(s).`);

  console.log("Migration completed successfully.");
  process.exit(0);
}

migrateUserRoles().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
