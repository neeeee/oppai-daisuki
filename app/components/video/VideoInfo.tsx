"use client";

import { useState } from "react";

interface Video {
  _id: string;
  title: string;
  channelAvatar: string;
  channelName: string;
  duration: string;
  viewCount: number;
  thumbnailUrl: string;
  videoSourceUrl: string;
  createdAt: string;
}

interface VideoInfoProps {
  video: Video;
}

export default function VideoInfo({ video }: VideoInfoProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);

  const formatViewCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toLocaleString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Mock description - you might want to add this field to your schema
  const description = `This video was uploaded on ${formatDate(video.createdAt)}.

Enjoy this content from ${video.channelName}!

Video duration: ${video.duration}
Views: ${formatViewCount(video.viewCount)}

#video #content #${video.channelName.toLowerCase().replace(/\s+/g, "")}`;

  return (
    <div className="space-y-4">
      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900">{video.title}</h1>

      {/* Video Stats */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>{formatViewCount(video.viewCount)} views</span>
          <span>•</span>
          <span>{formatDate(video.createdAt)}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
            <span>Like</span>
          </button>
          <button className="flex items-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M18 10.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 10.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
            </svg>
            <span>Dislike</span>
          </button>
          <button className="flex items-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Channel Info */}
      <div className="flex items-start space-x-3">
        <img
          src={video.channelAvatar}
          alt={video.channelName}
          className="w-12 h-12 rounded-full"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">
                {video.channelName}
              </h3>
              <p className="text-sm text-gray-600">Creator</p>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div
          className={`text-sm text-gray-700 ${showFullDescription ? "" : "line-clamp-3"}`}
        >
          {description.split("\n").map((line, index) => (
            <p key={index} className={index > 0 ? "mt-2" : ""}>
              {line}
            </p>
          ))}
        </div>
        <button
          onClick={() => setShowFullDescription(!showFullDescription)}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700 mt-2"
        >
          {showFullDescription ? "Show less" : "Show more"}
        </button>
      </div>
    </div>
  );
}
