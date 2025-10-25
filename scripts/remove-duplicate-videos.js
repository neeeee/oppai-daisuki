import mongoose from "mongoose";

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function removeDuplicateVideos() {
  try {
    console.log("🔧 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);

    const Video = mongoose.model(
      "Video",
      new mongoose.Schema({}, { strict: false, collection: "videos" }),
    );

    console.log("\n🔍 Searching for duplicate videos...\n");

    // Find duplicates by title
    const duplicatesByTitle = await Video.aggregate([
      {
        $group: {
          _id: "$title",
          count: { $sum: 1 },
          ids: { $push: "$_id" },
          slugs: { $push: "$slug" },
          createdAts: { $push: "$createdAt" },
        },
      },
      {
        $match: { count: { $gt: 1 } },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Find duplicates by slug (excluding null/undefined)
    const duplicatesBySlug = await Video.aggregate([
      {
        $match: {
          slug: { $ne: null, $exists: true },
        },
      },
      {
        $group: {
          _id: "$slug",
          count: { $sum: 1 },
          ids: { $push: "$_id" },
          titles: { $push: "$title" },
          createdAts: { $push: "$createdAt" },
        },
      },
      {
        $match: { count: { $gt: 1 } },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Find videos with missing slugs
    const missingSlugVideos = await Video.find({
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: undefined },
        { slug: "" },
      ],
    }).sort({ createdAt: -1 });

    let totalDuplicates = 0;
    let totalDeleted = 0;

    // Report duplicates by title
    if (duplicatesByTitle.length > 0) {
      console.log("📋 Duplicates found by TITLE:");
      duplicatesByTitle.forEach((dup, index) => {
        console.log(`\n${index + 1}. "${dup._id}" (${dup.count} copies)`);
        dup.ids.forEach((id, i) => {
          console.log(
            `   - ID: ${id}, Slug: ${dup.slugs[i] || "MISSING"}, Created: ${dup.createdAts[i]}`,
          );
        });
        totalDuplicates += dup.count;
      });
    }

    // Report duplicates by slug
    if (duplicatesBySlug.length > 0) {
      console.log("\n📋 Duplicates found by SLUG:");
      duplicatesBySlug.forEach((dup, index) => {
        console.log(`\n${index + 1}. Slug: "${dup._id}" (${dup.count} copies)`);
        dup.ids.forEach((id, i) => {
          console.log(
            `   - ID: ${id}, Title: "${dup.titles[i]}", Created: ${dup.createdAts[i]}`,
          );
        });
      });
    }

    // Report videos with missing slugs
    if (missingSlugVideos.length > 0) {
      console.log(
        `\n⚠️  Found ${missingSlugVideos.length} video(s) with MISSING slugs:`,
      );
      missingSlugVideos.forEach((video, index) => {
        console.log(
          `${index + 1}. "${video.title}" (ID: ${video._id}, Created: ${video.createdAt})`,
        );
      });
    }

    // Ask for confirmation before deleting
    if (
      duplicatesByTitle.length === 0 &&
      duplicatesBySlug.length === 0 &&
      missingSlugVideos.length === 0
    ) {
      console.log(
        "\n✅ No duplicates or missing slugs found! Database is clean.",
      );
      await mongoose.disconnect();
      return;
    }

    console.log("\n" + "=".repeat(60));
    console.log("CLEANUP STRATEGY:");
    console.log("=".repeat(60));

    // Delete videos with missing slugs
    if (missingSlugVideos.length > 0) {
      console.log(
        `\n🗑️  Deleting ${missingSlugVideos.length} video(s) with missing slugs...`,
      );
      const result = await Video.deleteMany({
        _id: { $in: missingSlugVideos.map((v) => v._id) },
      });
      console.log(`   ✓ Deleted ${result.deletedCount} videos`);
      totalDeleted += result.deletedCount;
    }

    // For duplicate titles, keep the newest one (latest createdAt)
    if (duplicatesByTitle.length > 0) {
      console.log(
        `\n🗑️  Processing ${duplicatesByTitle.length} group(s) of title duplicates...`,
      );
      for (const dup of duplicatesByTitle) {
        // Sort by createdAt and keep the newest
        const sorted = dup.ids
          .map((id, i) => ({
            id,
            createdAt: dup.createdAts[i],
            slug: dup.slugs[i],
          }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Keep the first one (newest), delete the rest
        const toKeep = sorted[0];
        const toDelete = sorted.slice(1).map((v) => v.id);

        if (toDelete.length > 0) {
          // Only delete if they don't have a valid slug (to avoid deleting intentional duplicates with different slugs)
          const deleteFilter = {
            _id: { $in: toDelete },
            $or: [
              { slug: null },
              { slug: undefined },
              { slug: "" },
              { slug: { $exists: false } },
            ],
          };
          const result = await Video.deleteMany(deleteFilter);
          console.log(
            `   ✓ For "${dup._id}": kept ${toKeep.id}, deleted ${result.deletedCount} duplicate(s)`,
          );
          totalDeleted += result.deletedCount;
        }
      }
    }

    // For duplicate slugs, keep the oldest one (earliest createdAt) as it's the original
    if (duplicatesBySlug.length > 0) {
      console.log(
        `\n🗑️  Processing ${duplicatesBySlug.length} group(s) of slug duplicates...`,
      );
      for (const dup of duplicatesBySlug) {
        // Sort by createdAt and keep the oldest
        const sorted = dup.ids
          .map((id, i) => ({
            id,
            createdAt: dup.createdAts[i],
            title: dup.titles[i],
          }))
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        // Keep the first one (oldest), delete the rest
        const toKeep = sorted[0];
        const toDelete = sorted.slice(1).map((v) => v.id);

        if (toDelete.length > 0) {
          const result = await Video.deleteMany({ _id: { $in: toDelete } });
          console.log(
            `   ✓ For slug "${dup._id}": kept ${toKeep.id}, deleted ${result.deletedCount} duplicate(s)`,
          );
          totalDeleted += result.deletedCount;
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 SUMMARY:");
    console.log("=".repeat(60));
    console.log(`Total duplicates found: ${totalDuplicates}`);
    console.log(`Total videos deleted: ${totalDeleted}`);
    console.log(`Remaining videos: ${await Video.countDocuments()}`);

    // Verify cleanup
    const stillMissingSlugs = await Video.countDocuments({
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: undefined },
        { slug: "" },
      ],
    });

    if (stillMissingSlugs > 0) {
      console.log(
        `\n⚠️  Warning: ${stillMissingSlugs} video(s) still have missing slugs`,
      );
      console.log('   Run "node scripts/fix-video-slugs.js" to fix them.');
    } else {
      console.log("\n✅ All remaining videos have valid slugs!");
    }

    // Show remaining videos
    console.log("\n📹 Remaining videos:");
    const remaining = await Video.find({}).sort({ createdAt: -1 }).limit(10);
    remaining.forEach((v, i) => {
      console.log(`${i + 1}. "${v.title}" (ID: ${v._id}, Slug: ${v.slug})`);
    });

    if (remaining.length === 10 && (await Video.countDocuments()) > 10) {
      console.log(`   ... and ${(await Video.countDocuments()) - 10} more`);
    }

    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
    console.log("✅ Cleanup complete!\n");
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

removeDuplicateVideos();
