import { db } from "../src/lib/mongodb.js";

async function makeAdmin() {
  const targetEmail = process.argv[2]?.trim()?.toLowerCase();

  if (!targetEmail) {
    console.log("Usage: node --env-file=.env.local scripts/make-admin.mjs <user-email>");
    console.log("Existing admins in database:");
    const admins = await db.collection("user").find({ role: "admin" }).project({ name: 1, email: 1, createdAt: 1 }).toArray();
    console.table(admins);
    process.exit(0);
  }

  const user = await db.collection("user").findOne({ email: targetEmail });
  if (!user) {
    console.error(`Error: User with email "${targetEmail}" was not found in the database.`);
    process.exit(1);
  }

  await db.collection("user").updateOne(
    { _id: user._id },
    {
      $set: {
        role: "admin",
        updatedAt: new Date()
      }
    }
  );

  console.log(`Success: User "${user.name}" (${user.email}) has been granted the "admin" role.`);
  process.exit(0);
}

makeAdmin().catch((err) => {
  console.error("make-admin error:", err);
  process.exit(1);
});
