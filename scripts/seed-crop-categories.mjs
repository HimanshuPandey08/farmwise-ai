import { db } from "../src/lib/mongodb.js";
import { INITIAL_CROP_CATEGORIES } from "../src/lib/crop-categories.js";

async function seedCropCategories() {
  console.log("Seeding / Syncing 'cropCategories' collection in MongoDB...");

  for (const cat of INITIAL_CROP_CATEGORIES) {
    await db.collection("cropCategories").updateOne(
      { slug: cat.slug },
      {
        $set: {
          ...cat,
          isActive: true,
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );
  }

  await db.collection("cropCategories").createIndex({ slug: 1 }, { unique: true });
  await db.collection("cropCategories").createIndex({ order: 1 });

  const total = await db.collection("cropCategories").countDocuments();
  console.log(`Successfully synced ${total} crop categories in database.`);
  process.exit(0);
}

seedCropCategories().catch((err) => {
  console.error("Seeding crop categories failed:", err);
  process.exit(1);
});
