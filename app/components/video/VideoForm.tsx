"use client";

import { useState, useEffect } from "react";
import VideoUploader from "./VideoUploader";

interface VideoFormData {
  title: string;
  channelAvatar: string;
  channelName: string;
  duration: string;
  viewCount: number;
  thumbnailUrl: string;
  videoSourceUrl: string;
}

interface VideoFormProps {
  onSubmit: (data: VideoFormData) => Promise<void>;
  initialData?: VideoFormData | null;
  onCancel?: () => void;
}

export default function VideoForm({
  onSubmit,
  initialData = null,
  onCancel,
}: VideoFormProps) {
  const [formData, setFormData] = useState<VideoFormData>({
    title: initialData?.title || "",
    channelAvatar: initialData?.channelAvatar || "",
    channelName: initialData?.channelName || "",
    duration: initialData?.duration || "",
    viewCount: initialData?.viewCount || 0,
    thumbnailUrl: initialData?.thumbnailUrl || "",
    videoSourceUrl: initialData?.videoSourceUrl || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [videoFileName, setVideoFileName] = useState("");

  // Auto-generate title from filename if title is empty
  useEffect(() => {
    if (videoFileName && !formData.title) {
      const cleanTitle = videoFileName
        .replace(/\.[^/.]+$/, "") // Remove file extension
        .replace(/[-_]/g, " ") // Replace dashes and underscores with spaces
        .replace(/\b\w/g, (l) => l.toUpperCase()); // Capitalize first letter of each word

      setFormData((prev) => ({ ...prev, title: cleanTitle }));
    }
  }, [videoFileName, formData.title]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "viewCount" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVideoUploaded = (url: string, fileName: string) => {
    setFormData((prev) => ({ ...prev, videoSourceUrl: url }));
    setVideoFileName(fileName);
    setShowUploader(false);
  };

  const handleThumbnailUploaded = (url: string) => {
    setFormData((prev) => ({ ...prev, thumbnailUrl: url }));
  };

  const handleChannelAvatarUploaded = (url: string) => {
    setFormData((prev) => ({ ...prev, channelAvatar: url }));
  };

  const extractVideoIdFromFileName = (fileName: string) => {
    const match = fileName.match(/(\d+)/);
    return match ? match[1] : Math.floor(Math.random() * 1000).toString();
  };

  const generateDuration = () => {
    // Generate random duration between 1:00 and 20:00
    const minutes = Math.floor(Math.random() * 19) + 1;
    const seconds = Math.floor(Math.random() * 60);
    const duration = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    setFormData((prev) => ({ ...prev, duration }));
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow">
      {/* Upload Toggle */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {initialData ? "Edit Video" : "Add New Video"}
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Upload Mode:</span>
          <button
            type="button"
            onClick={() => setShowUploader(!showUploader)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              showUploader
                ? "bg-indigo-100 text-indigo-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {showUploader ? "Manual Entry" : "File Upload"}
          </button>
        </div>
      </div>

      {/* Upload Section */}
      {showUploader && (
        <VideoUploader
          onVideoUploaded={handleVideoUploaded}
          onThumbnailUploaded={handleThumbnailUploaded}
          onChannelAvatarUploaded={handleChannelAvatarUploaded}
        />
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Video Source URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Video Source URL {showUploader && "(Auto-filled from upload)"}
          </label>
          <input
            type="url"
            name="videoSourceUrl"
            value={formData.videoSourceUrl}
            onChange={handleChange}
            required
            disabled={showUploader}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              showUploader ? "bg-gray-50" : ""
            }`}
            placeholder="https://uploadthing.com/f/..."
          />
        </div>

        {/* Video Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Video Title {videoFileName && "(Auto-generated from filename)"}
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        {/* Thumbnail URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Thumbnail URL {showUploader && "(Upload thumbnail above)"}
          </label>
          <div className="flex space-x-2">
            <input
              type="url"
              name="thumbnailUrl"
              value={formData.thumbnailUrl}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          {formData.thumbnailUrl && (
            <div className="mt-2">
              <img
                src={formData.thumbnailUrl}
                alt="Thumbnail preview"
                className="w-32 h-20 object-cover rounded border"
              />
            </div>
          )}
        </div>

        {/* Channel Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Channel Name
            </label>
            <input
              type="text"
              name="channelName"
              value={formData.channelName}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Channel Avatar URL {showUploader && "(Upload avatar above)"}
            </label>
            <input
              type="url"
              name="channelAvatar"
              value={formData.channelAvatar}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            {formData.channelAvatar && (
              <div className="mt-2">
                <img
                  src={formData.channelAvatar}
                  alt="Avatar preview"
                  className="w-8 h-8 rounded-full border"
                />
              </div>
            )}
          </div>
        </div>

        {/* Duration and View Count */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Duration
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="e.g., 5:24"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={generateDuration}
                className="mt-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 transition-colors"
              >
                Random
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              View Count
            </label>
            <input
              type="number"
              name="viewCount"
              value={formData.viewCount}
              onChange={handleChange}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={
              isSubmitting || !formData.videoSourceUrl || !formData.title
            }
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isSubmitting
              ? "Saving..."
              : initialData
                ? "Update Video"
                : "Add Video"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
