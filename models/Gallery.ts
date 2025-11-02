import mongoose, { Schema, Document } from "mongoose";

export interface GalleryDocument extends Document {
  title: string;
  description?: string;
  slug: string;
  coverPhoto?: string;
  coverPhotoKey?: string; // UploadThing key for deletion
  photos: mongoose.Types.ObjectId[]; // reference actual Photo docs
  isPublic: boolean;
  photoCount: number;
  tags: string[];
  category?: string;
  genres?: mongoose.Types.ObjectId[];
  photographer?: string;
  location?: string;
  dateTaken?: Date;
  isAdult: boolean;
  idol?: mongoose.Types.ObjectId;
  metadata: { featured: boolean; trending?: boolean };
  createdAt: Date;
  updatedAt: Date;
}

const GallerySchema = new Schema<GalleryDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    coverPhoto: { type: String },
    coverPhotoKey: { type: String }, // UploadThing file key
    photos: [{ type: Schema.Types.ObjectId, ref: "Photo" }],
    isPublic: { type: Boolean, default: true },
    isAdult: { type: Boolean, default: false },
    photoCount: { type: Number, default: 0 },
    tags: [{ type: String, trim: true }],
    category: { type: String, trim: true },
    genres: [{ type: Schema.Types.ObjectId, ref: "Genre" }],
    photographer: { type: String, trim: true },
    location: { type: String, trim: true },
    dateTaken: { type: Date },
    metadata: { featured: { type: Boolean, default: false }, trending: { type: Boolean, default: false } },
    idol: { type: Schema.Types.ObjectId, ref: "Idol" },
  },
  { timestamps: true },
);

function genSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
}

GallerySchema.pre("validate", function (next) {
  if (this.title && (!this.slug || this.isModified("title"))) {
    this.slug = genSlug(this.title);
  }
  next();
});

const Gallery =
  mongoose.models.Gallery || mongoose.model<GalleryDocument>("Gallery", GallerySchema);

export default Gallery;