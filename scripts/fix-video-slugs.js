require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// Slug generation function (must match the one in Video model)
function generateVideoSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fixVideoSlugs() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);

    const Video = mongoose.model('Video', new mongoose.Schema({}, { strict: false, collection: 'videos' }));

    // Find videos with missing or invalid slugs
    const videosToFix = await Video.find({
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: undefined },
        { slug: '' }
      ]
    });

    if (videosToFix.length === 0) {
      console.log('✓ No videos need slug fixes. All good!');
      await mongoose.disconnect();
      return;
    }

    console.log(`\n📝 Found ${videosToFix.length} video(s) with missing slugs:\n`);

    let fixed = 0;
    let errors = 0;

    for (const video of videosToFix) {
      try {
        if (!video.title) {
          console.log(`⚠️  Video ${video._id} has no title, skipping...`);
          errors++;
          continue;
        }

        const newSlug = generateVideoSlug(video.title);

        // Check if slug already exists
        const existing = await Video.findOne({ slug: newSlug, _id: { $ne: video._id } });

        if (existing) {
          // Add a unique suffix if slug exists
          const timestamp = Date.now();
          const uniqueSlug = `${newSlug}-${timestamp}`;
          await Video.updateOne({ _id: video._id }, { $set: { slug: uniqueSlug } });
          console.log(`✓ Fixed: "${video.title}" -> "${uniqueSlug}" (added suffix to avoid duplicate)`);
        } else {
          await Video.updateOne({ _id: video._id }, { $set: { slug: newSlug } });
          console.log(`✓ Fixed: "${video.title}" -> "${newSlug}"`);
        }

        fixed++;
      } catch (error) {
        console.error(`✗ Error fixing video ${video._id}:`, error.message);
        errors++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Fixed: ${fixed}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Total: ${videosToFix.length}`);

    // Verify all videos now have slugs
    const stillMissing = await Video.countDocuments({
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: undefined },
        { slug: '' }
      ]
    });

    if (stillMissing === 0) {
      console.log('\n✅ All videos now have valid slugs!');
    } else {
      console.log(`\n⚠️  Warning: ${stillMissing} video(s) still have missing slugs`);
    }

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

fixVideoSlugs();
