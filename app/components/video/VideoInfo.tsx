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
      <h1 className="text-2xl font-bold text-gray-900">{video.title}</h1>

      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>{formatViewCount(video.viewCount)} views</span>
          <span>•</span>
          <span>{formatDate(video.createdAt)}</span>
        </div>
      </div>

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
