import mongoose from "mongoose";

const GallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    coverPhoto: {
      type: String, // UploadThing URL
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    photoCount: {
      type: Number,
      default: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    category: {
      type: String,
      trim: true,
    },
    photographer: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    dateTaken: {
      type: Date,
    },
    isAdult: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    photos: [
      {
        type: String,
      },
    ],
    metadata: {
      featured: {
        type: Boolean,
        default: false,
      },
      trending: {
        type: Boolean,
        default: false,
      },
      qualityScore: {
        type: Number,
        default: 0,
      },
    },
    idol: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Idol",
    },
    genre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Genre",
    },
  },
  {
    timestamps: true,
  },
);

// Create indexes for better query performance
GallerySchema.index({ title: "text", description: "text", tags: "text" });
GallerySchema.index({ slug: 1 });
GallerySchema.index({ category: 1 });
GallerySchema.index({ isPublic: 1 });
GallerySchema.index({ isAdult: 1 });
GallerySchema.index({ createdAt: -1 });
GallerySchema.index({ viewCount: -1 });
GallerySchema.index({ likeCount: -1 });
GallerySchema.index({ downloadCount: -1 });
GallerySchema.index({ "metadata.featured": 1 });
GallerySchema.index({ "metadata.trending": 1 });
GallerySchema.index({ "metadata.qualityScore": -1 });
GallerySchema.index({ idol: 1 });
GallerySchema.index({ genre: 1 });

// Pre-save middleware to generate slug from title
GallerySchema.pre("save", function (next) {
  if (this.isModified("title") || this.isNew) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  next();
});

export default mongoose.models.Gallery ||
  mongoose.model("Gallery", GallerySchema);
