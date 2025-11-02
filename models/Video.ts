import mongoose from "mongoose";

export interface VideoDocument extends mongoose.Document {
  title: string;
  description?: string;
  slug: string;
  channelAvatar: string;
  channelName: string;
  duration: string;
  viewCount: number;
  likeCount: number;
  thumbnailUrl: string;
  videoSourceUrl: string;
  thumbnailUploadKey?: string; // UploadThing key for thumbnail file
  videoUploadKey?: string; // UploadThing key for main video file
  idol: mongoose.Types.ObjectId;
  genres?: mongoose.Types.ObjectId[];
  tags?: string[];
  category?: string;
  uploadDate: Date;
  releaseDate?: Date;
  isPublic: boolean;
  isAdult: boolean;
  isFeatured: boolean;
  metadata: {
    featured: boolean;
    trending: boolean;
    qualityScore: number;
    resolution?: string;
    fileSize?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const VideoSchema = new mongoose.Schema<VideoDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    channelAvatar: { type: String, required: true },
    channelName: { type: String, required: true, trim: true },
    duration: { type: String, required: true },

    // --- UploadThing & source URLs ---

    thumbnailUrl: { type: String, required: true },
    videoSourceUrl: { type: String, required: true },
    thumbnailUploadKey: { type: String, required: false },
    videoUploadKey: { type: String, required: false },

    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    idol: { type: mongoose.Schema.Types.ObjectId, ref: "Idol", required: true },
    genres: [{ type: mongoose.Schema.Types.ObjectId, ref: "Genre" }],
    tags: [{ type: String, trim: true }],
    category: { type: String, trim: true },
    uploadDate: { type: Date, default: Date.now },
    releaseDate: { type: Date },
    isPublic: { type: Boolean, default: true },
    isAdult: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    metadata: {
      featured: { type: Boolean, default: false },
      trending: { type: Boolean, default: false },
      qualityScore: { type: Number, default: 0 },
      resolution: { type: String },
      fileSize: { type: Number },
    },
  },
  {
    timestamps: true,
  },
);

// Generate slug
function generateVideoSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

VideoSchema.pre("validate", function (next) {
  if (this.title && (!this.slug || this.isModified("title"))) {
    this.slug = generateVideoSlug(this.title);
  }
  next();
});

// Useful indices
VideoSchema.index({ title: "text", description: "text", tags: "text" });
VideoSchema.index({ slug: 1 }, { unique: true });
VideoSchema.index({ idol: 1, genres: 1, category: 1 });
VideoSchema.index({ createdAt: -1 });

const Video =
  mongoose.models.Video || mongoose.model<VideoDocument>("Video", VideoSchema);

export default Video;