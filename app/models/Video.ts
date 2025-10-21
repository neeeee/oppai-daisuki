import mongoose from "mongoose";

const VideoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
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
      required: true,
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
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.Video || mongoose.model("Video", VideoSchema);
