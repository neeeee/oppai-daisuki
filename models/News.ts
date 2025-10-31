import mongoose from "mongoose";

const NewsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    excerpt: {
      type: String,
      trim: true,
      maxLength: 500,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        trim: true,
      },
      avatar: {
        type: String, // UploadThing URL
      },
    },
    featuredImage: {
      type: String, // UploadThing URL
    },
    images: [
      {
        url: {
          type: String, // UploadThing URL
          required: true,
        },
        caption: {
          type: String,
          trim: true,
        },
        altText: {
          type: String,
          trim: true,
        },
      },
    ],
    category: {
      type: String,
      required: true,
      trim: true,
      enum: [
        "general",
        "releases",
        "events",
        "interviews",
        "announcements",
        "reviews",
        "industry",
        "behind-the-scenes",
        "personal",
        "collaborations",
      ],
      default: "general",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    relatedIdols: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Idol",
      },
    ],
    relatedGenres: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Genre",
      },
    ],
    status: {
      type: String,
      enum: ["draft", "published", "archived", "scheduled"],
      default: "draft",
    },
    publishedAt: {
      type: Date,
    },
    scheduledAt: {
      type: Date,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isBreaking: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    seoMeta: {
      metaTitle: {
        type: String,
        trim: true,
        maxLength: 60,
      },
      metaDescription: {
        type: String,
        trim: true,
        maxLength: 160,
      },
      keywords: [
        {
          type: String,
          trim: true,
        },
      ],
    },
    engagement: {
      viewCount: {
        type: Number,
        default: 0,
      },
      likeCount: {
        type: Number,
        default: 0,
      },
      shareCount: {
        type: Number,
        default: 0,
      },
      commentCount: {
        type: Number,
        default: 0,
      },
    },
    readingTime: {
      type: Number, // in minutes
      default: 1,
    },
    language: {
      type: String,
      default: "en",
      trim: true,
    },
    translations: [
      {
        language: {
          type: String,
          required: true,
          trim: true,
        },
        title: {
          type: String,
          required: true,
          trim: true,
        },
        excerpt: {
          type: String,
          trim: true,
        },
        content: {
          type: String,
          required: true,
        },
      },
    ],
    metadata: {
      source: {
        type: String,
        trim: true,
      },
      sourceUrl: {
        type: String,
        trim: true,
      },
      lastEditedBy: {
        type: String,
        trim: true,
      },
      revisionCount: {
        type: Number,
        default: 0,
      },
      isExclusive: {
        type: Boolean,
        default: false,
      },
      exclusiveUntil: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  },
);

// Create indexes for better query performance
NewsSchema.index({
  title: "text",
  excerpt: "text",
  content: "text",
  tags: "text",
});
NewsSchema.index({ slug: 1 });
NewsSchema.index({ status: 1 });
NewsSchema.index({ category: 1 });
NewsSchema.index({ isPublic: 1 });
NewsSchema.index({ isFeatured: 1 });
NewsSchema.index({ isBreaking: 1 });
NewsSchema.index({ priority: -1 });
NewsSchema.index({ publishedAt: -1 });
NewsSchema.index({ createdAt: -1 });
NewsSchema.index({ "engagement.viewCount": -1 });
NewsSchema.index({ "engagement.likeCount": -1 });
NewsSchema.index({ relatedIdols: 1 });
NewsSchema.index({ relatedGenres: 1 });
NewsSchema.index({ "author.name": 1 });

// Virtual for reading time calculation based on content length
NewsSchema.virtual("calculatedReadingTime").get(function () {
  if (!this.content) return 1;
  const wordsPerMinute = 200;
  const wordCount = this.content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
});

// Generate slug function
function generateNewsSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Pre-validate middleware to generate slug BEFORE validation runs
NewsSchema.pre("validate", function (next) {
  if (this.title && (!this.slug || this.isModified("title"))) {
    this.slug = generateNewsSlug(this.title);
  }
  next();
});

// Pre-save middleware as backup and other operations
NewsSchema.pre("save", function (next) {
  if (this.title && (!this.slug || this.isModified("title"))) {
    this.slug = generateNewsSlug(this.title);
  }

  // Auto-calculate reading time
  if (this.isModified("content")) {
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / 200);
  }

  // Auto-set publishedAt when status changes to published
  if (
    this.isModified("status") &&
    this.status === "published" &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }

  // Increment revision count
  if (this.isModified() && !this.isNew) {
    if (!this.metadata) {
      this.metadata = {
        revisionCount: 0,
        isExclusive: false,
      };
    } else {
      this.metadata.revisionCount = (this.metadata.revisionCount || 0) + 1;
    }
  }

  next();
});

// Static methods removed - use direct queries instead

// Ensure virtuals are included in JSON output
NewsSchema.set("toJSON", { virtuals: true });
NewsSchema.set("toObject", { virtuals: true });

const News = mongoose.models.News || mongoose.model("News", NewsSchema);
export { News };
export default News;
