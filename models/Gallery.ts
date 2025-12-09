import mongoose, { Schema, Document } from "mongoose";

export interface GalleryDocument extends Document {
  title: string;
  description?: string;
  slug: string;
  coverPhoto?: string;
  coverPhotoKey?: string;
  photos: mongoose.Types.ObjectId[];
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
    slug: { type: String, unique: true, trim: true },
    coverPhoto: { type: String },
    coverPhotoKey: { type: String },
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

// REPLACED: Logic to use _id as slug
GallerySchema.pre("validate", function (next) {
  // If slug is not set, use the _id
  if (!this.slug && this._id) {
    this.slug = this._id.toString();
  }
  next();
});

const Gallery =
  mongoose.models.Gallery || mongoose.model<GalleryDocument>("Gallery", GallerySchema);

export default Gallery;
