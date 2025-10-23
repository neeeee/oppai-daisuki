import mongoose from "mongoose";

const PhotoSchema = new mongoose.Schema(
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
    imageUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
      required: true,
    },
    altText: {
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
    resolution: {
      width: {
        type: Number,
      },
      height: {
        type: Number,
      },
    },
    fileSize: {
      type: Number, // in bytes
    },
    dimensions: {
      width: {
        type: Number,
      },
      height: {
        type: Number,
      },
    },
    captureDate: {
      type: Date,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    isPublic: {
      type: Boolean,
      default: true,
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
    gallery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gallery",
    },
    idol: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Idol",
    },
  },
  {
    timestamps: true,
  },
);

// Create indexes for better query performance
PhotoSchema.index({ title: "text", description: "text", tags: "text" });
PhotoSchema.index({ slug: 1 });
PhotoSchema.index({ category: 1 });
PhotoSchema.index({ isPublic: 1 });
PhotoSchema.index({ isAdult: 1 });
PhotoSchema.index({ createdAt: -1 });
PhotoSchema.index({ uploadDate: -1 });
PhotoSchema.index({ captureDate: -1 });
PhotoSchema.index({ viewCount: -1 });
PhotoSchema.index({ likeCount: -1 });
PhotoSchema.index({ downloadCount: -1 });
PhotoSchema.index({ "metadata.featured": 1 });
PhotoSchema.index({ "metadata.trending": 1 });
PhotoSchema.index({ "metadata.qualityScore": -1 });
PhotoSchema.index({ gallery: 1 });
PhotoSchema.index({ idol: 1 });

// Generate slug function
function generatePhotoSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Pre-validate middleware to generate slug BEFORE validation runs
PhotoSchema.pre("validate", function (next) {
  if (this.title && (!this.slug || this.isModified("title"))) {
    this.slug = generatePhotoSlug(this.title);
  }
  next();
});

// Pre-save middleware as backup
PhotoSchema.pre("save", function (next) {
  if (this.title && (!this.slug || this.isModified("title"))) {
    this.slug = generatePhotoSlug(this.title);
  }
  next();
});

export default mongoose.models.Photo || mongoose.model("Photo", PhotoSchema);
