import mongoose from "mongoose";
import logger from "@/lib/utils/logger";

const GenreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
      default: "#6366f1", // Default indigo color
    },
    icon: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String, // UploadThing URL
    },
    parentGenre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Genre",
    },
    subGenres: [
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
    isPublic: {
      type: Boolean,
      default: true,
    },
    isAdult: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    contentCounts: {
      photos: {
        type: Number,
        default: 0,
      },
      videos: {
        type: Number,
        default: 0,
      },
      galleries: {
        type: Number,
        default: 0,
      },
      idols: {
        type: Number,
        default: 0,
      },
      news: {
        type: Number,
        default: 0,
      },
    },
    metadata: {
      featured: {
        type: Boolean,
        default: false,
      },
      featuredUntil: {
        type: Date,
      },
      trending: {
        type: Boolean,
        default: false,
      },
      popularityScore: {
        type: Number,
        default: 0,
      },
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    followCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Create indexes for better query performance
GenreSchema.index({ name: "text", description: "text", tags: "text" });
GenreSchema.index({ slug: 1 });
GenreSchema.index({ isPublic: 1 });
GenreSchema.index({ isAdult: 1 });
GenreSchema.index({ sortOrder: 1 });
GenreSchema.index({ createdAt: -1 });
GenreSchema.index({ viewCount: -1 });
GenreSchema.index({ followCount: -1 });
GenreSchema.index({ parentGenre: 1 });
GenreSchema.index({ "metadata.featured": 1 });
GenreSchema.index({ "metadata.trending": 1 });
GenreSchema.index({ "metadata.popularityScore": -1 });

// Generate slug function
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Pre-validate middleware to generate slug BEFORE validation runs
GenreSchema.pre("validate", function (next) {
  if (this.name && (!this.slug || this.isModified("name"))) {
    this.slug = generateSlug(this.name);
  }
  next();
});

// Pre-save middleware as backup
GenreSchema.pre("save", function (next) {
  if (this.name && (!this.slug || this.isModified("name"))) {
    this.slug = generateSlug(this.name);
  }
  next();
});

// Pre-save middleware to update parent genre's subGenres array
GenreSchema.pre("save", async function (next) {
  if (this.isModified("parentGenre") && this.parentGenre) {
    try {
      await mongoose.model("Genre").findByIdAndUpdate(this.parentGenre, {
        $addToSet: { subGenres: this._id },
      });
    } catch (error) {
      logger.error("Error updating parent genre:", error);
    }
  }
  next();
});

// Pre-remove middleware to clean up references
GenreSchema.pre("remove", async function (next) {
  try {
    // Remove from parent's subGenres array
    if (this.parentGenre) {
      await mongoose.model("Genre").findByIdAndUpdate(this.parentGenre, {
        $pull: { subGenres: this._id },
      });
    }

    // Update child genres to remove parent reference
    await mongoose
      .model("Genre")
      .updateMany({ parentGenre: this._id }, { $unset: { parentGenre: 1 } });
  } catch (error) {
    logger.error("Error during genre cleanup:", error);
  }
  next();
});

export default mongoose.models.Genre || mongoose.model("Genre", GenreSchema);
