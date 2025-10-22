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
    tags: [{
      type: String,
      trim: true,
    }],
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
    isPublic: {
      type: Boolean,
      default: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    gallery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gallery',
    },
    idol: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Idol',
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
PhotoSchema.index({ title: 'text', description: 'text', tags: 'text' });
PhotoSchema.index({ category: 1 });
PhotoSchema.index({ isPublic: 1 });
PhotoSchema.index({ createdAt: -1 });
PhotoSchema.index({ viewCount: -1 });
PhotoSchema.index({ likeCount: -1 });
PhotoSchema.index({ gallery: 1 });
PhotoSchema.index({ idol: 1 });

export default mongoose.models.Photo || mongoose.model("Photo", PhotoSchema);
