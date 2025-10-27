"use client";

import { useState } from "react";
import { UploadDropzone } from "../../lib/uploadthing";

interface VideoUploaderProps {
  onVideoUploaded: (url: string, fileName: string) => void;
  onThumbnailUploaded: (url: string) => void;
  onChannelAvatarUploaded: (url: string) => void;
}

export default function VideoUploader({
  onVideoUploaded,
  onThumbnailUploaded,
  onChannelAvatarUploaded,
}: VideoUploaderProps) {
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  return (
    <div className="space-y-8">
      {/* Video Upload */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Video</h3>
        {uploadingVideo ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Uploading video...</span>
          </div>
        ) : (
          <UploadDropzone
            endpoint="videoUploader"
            onClientUploadComplete={(res) => {
              if (res?.[0]) {
                onVideoUploaded(res[0].url, res[0].name);
                setUploadingVideo(false);
              }
            }}
            onUploadError={(error: Error) => {
              alert(`Video upload failed: ${error.message}`);
              setUploadingVideo(false);
            }}
            onUploadBegin={() => {
              setUploadingVideo(true);
            }}
            appearance={{
              container:
                "border-2 border-dashed border-gray-300 rounded-lg p-8",
              label: "text-gray-600",
              allowedContent: "text-gray-500 text-sm",
              button:
                "bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md text-white text-sm font-medium transition-colors",
            }}
          />
        )}
      </div>

      {/* Thumbnail Upload */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Upload Thumbnail
        </h3>
        {uploadingThumbnail ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Uploading thumbnail...</span>
          </div>
        ) : (
          <UploadDropzone
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              if (res?.[0]) {
                onThumbnailUploaded(res[0].url);
                setUploadingThumbnail(false);
              }
            }}
            onUploadError={(error: Error) => {
              alert(`Thumbnail upload failed: ${error.message}`);
              setUploadingThumbnail(false);
            }}
            onUploadBegin={() => {
              setUploadingThumbnail(true);
            }}
            appearance={{
              container:
                "border-2 border-dashed border-gray-300 rounded-lg p-8",
              label: "text-gray-600",
              allowedContent: "text-gray-500 text-sm",
              button:
                "bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md text-white text-sm font-medium transition-colors",
            }}
          />
        )}
      </div>

      {/* Channel Avatar Upload */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Upload Channel Avatar
        </h3>
        {uploadingAvatar ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Uploading avatar...</span>
          </div>
        ) : (
          <UploadDropzone
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              if (res?.[0]) {
                onChannelAvatarUploaded(res[0].url);
                setUploadingAvatar(false);
              }
            }}
            onUploadError={(error: Error) => {
              alert(`Avatar upload failed: ${error.message}`);
              setUploadingAvatar(false);
            }}
            onUploadBegin={() => {
              setUploadingAvatar(true);
            }}
            appearance={{
              container:
                "border-2 border-dashed border-gray-300 rounded-lg p-8",
              label: "text-gray-600",
              allowedContent: "text-gray-500 text-sm",
              button:
                "bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md text-white text-sm font-medium transition-colors",
            }}
          />
        )}
      </div>
    </div>
  );
}
