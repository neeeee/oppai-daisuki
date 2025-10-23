import mongoose from "mongoose";

const VideoSchema = new mongoose.Schema(
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
    channelAvatar: {
      type: String,
      required: true,
    },
    channelName: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: String,
      required: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    thumbnailUrl: {
      type: String,
      required: true,
    },
    videoSourceUrl: {
      type: String,
      required: true,
    },
    idol: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Idol",
      required: true,
    },
    genres: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Genre",
      },
    ],
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
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    releaseDate: {
      type: Date,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    isAdult: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
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
      resolution: {
        type: String,
        trim: true,
      },
      fileSize: {
        type: Number, // in bytes
      },
    },
  },
  {
    timestamps: true,
  },
);

// Create indexes for better query performance
VideoSchema.index({ title: "text", description: "text", tags: "text" });
VideoSchema.index({ slug: 1 }, { unique: true });
VideoSchema.index({ idol: 1 });
VideoSchema.index({ genres: 1 });
VideoSchema.index({ category: 1 });
VideoSchema.index({ isPublic: 1 });
VideoSchema.index({ isAdult: 1 });
VideoSchema.index({ createdAt: -1 });
VideoSchema.index({ uploadDate: -1 });
VideoSchema.index({ viewCount: -1 });
VideoSchema.index({ likeCount: -1 });
VideoSchema.index({ "metadata.featured": 1 });
VideoSchema.index({ "metadata.trending": 1 });

// Generate slug function
function generateVideoSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Pre-validate middleware to generate slug BEFORE validation runs
VideoSchema.pre("validate", function (next) {
  if (this.title && (!this.slug || this.isModified("title"))) {
    this.slug = generateVideoSlug(this.title);
  }
  next();
});

// Pre-save middleware as backup
VideoSchema.pre("save", function (next) {
  if (this.title && (!this.slug || this.isModified("title"))) {
    this.slug = generateVideoSlug(this.title);
  }
  next();
});

// Delete the model from cache if it exists to ensure fresh schema
if (mongoose.models.Video) {
  delete mongoose.models.Video;
}

export default mongoose.model("Video", VideoSchema);
