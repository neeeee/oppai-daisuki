import mongoose, { Schema, Document } from "mongoose";

export interface PhotoDocument extends Document {
  title: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl: string;
  uploadThingKey: string; // **NEW FIELD** — used for deletion
  altText?: string;
  slug: string;
  tags: string[];
  category?: string;
  photographer?: string;
  location?: string;
  dateTaken?: Date;
  resolution?: { width?: number; height?: number };
  fileSize?: number;
  isPublic: boolean;
  isAdult: boolean;
  viewCount: number;
  likeCount: number;
  downloadCount: number;
  gallery?: mongoose.Types.ObjectId;
  idol?: mongoose.Types.ObjectId;
  metadata: {
    featured: boolean;
    trending: boolean;
    qualityScore: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PhotoSchema = new Schema<PhotoDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    imageUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    uploadThingKey: { type: String, required: true },
    altText: { type: String, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    tags: [{ type: String, trim: true }],
    category: { type: String, trim: true },
    photographer: { type: String, trim: true },
    location: { type: String, trim: true },
    dateTaken: { type: Date },
    resolution: {
      width: Number,
      height: Number,
    },
    fileSize: Number,
    isPublic: { type: Boolean, default: true },
    isAdult: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    downloadCount: { type: Number, default: 0 },
    metadata: {
      featured: { type: Boolean, default: false },
      trending: { type: Boolean, default: false },
      qualityScore: { type: Number, default: 0 },
    },
    gallery: { type: Schema.Types.ObjectId, ref: "Gallery" },
    idol: { type: Schema.Types.ObjectId, ref: "Idol" },
  },
  { timestamps: true },
);

function slugifyTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
}

PhotoSchema.pre("validate", function (next) {
  if (this.title && (!this.slug || this.isModified("title"))) {
    this.slug = slugifyTitle(this.title);
  }
  next();
});

const Photo = mongoose.models.Photo || mongoose.model<PhotoDocument>("Photo", PhotoSchema);
export default Photo;