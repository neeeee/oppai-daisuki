import mongoose, { Schema } from "mongoose";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in .env file");
  process.exit(1);
}

// --- 1. Define Schemas Inline (Avoids import errors) ---

// Gallery Schema
const GallerySchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String }, // We will update this
    photos: [{ type: Schema.Types.ObjectId, ref: "Photo" }],
  },
  { strict: false } // strict: false allows us to update fields even if this schema definition is incomplete
);

// Photo Schema
const PhotoSchema = new Schema(
  {
    gallery: { type: Schema.Types.ObjectId, ref: "Gallery" },
    slug: { type: String },
    order: { type: Number },
  },
  { strict: false }
);

// --- 2. Create Models ---
// We use mongoose.models to check if it already exists, preventing overwrite errors
const Gallery = mongoose.models.Gallery || mongoose.model("Gallery", GallerySchema);
const Photo = mongoose.models.Photo || mongoose.model("Photo", PhotoSchema);

// --- 3. Migration Logic ---
const migrate = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected.");

    const galleries = await Gallery.find({});
    console.log(`Found ${galleries.length} galleries to process.`);

    let processedCount = 0;
    let errorCount = 0;

    for (const gallery of galleries) {
      try {
        const oldSlug = gallery.slug;
        const newSlug = gallery._id.toString();

        // Check if migration is needed
        if (oldSlug === newSlug) {
          console.log(`[${gallery._id}] Already migrated. Skipping.`);
          continue;
        }

        // Update Gallery Slug
        gallery.slug = newSlug;
        await gallery.save();

        // Update Associated Photos
        const photos = await Photo.find({ gallery: gallery._id });
        
        if (photos.length > 0) {
          const photoUpdates = photos.map((photo: any, index: number) => {
            const order = photo.order || index + 1;
            photo.slug = `${newSlug}-photo-${order}`;
            return photo.save();
          });
          await Promise.all(photoUpdates);
        }

        console.log(
          `✅ Updated: "${gallery.title}" (${photos.length} photos updated)`
        );
        processedCount++;
      } catch (err: any) {
        console.error(`❌ Error on gallery ${gallery._id}:`, err.message);
        errorCount++;
      }
    }

    console.log("\n------------------------------------------------");
    console.log(`Migration Complete.`);
    console.log(`Updated: ${processedCount}`);
    console.log(`Errors:  ${errorCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Fatal script error:", error);
    process.exit(1);
  }
};

migrate();
