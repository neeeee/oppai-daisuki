"use client";

import { useState } from "react";
import Image from "next/image";
import { formatCount } from "../../lib/utils/dateUtils";

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
Views: ${formatCount(video.viewCount)}

#video #content #${video.channelName.toLowerCase().replace(/\s+/g, "")}`;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {video.title}
      </h1>

      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-white">
          <span>{formatCount(video.viewCount)} views</span>
          <span>•</span>
          <span>{formatDate(video.createdAt)}</span>
        </div>
      </div>

      <div className="flex items-start space-x-3">
        <div className="relative w-12 h-12 rounded-full overflow-hidden">
          <Image
            src={video.channelAvatar}
            alt={video.channelName}
            fill
            className="object-cover"
            sizes="48px"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {video.channelName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-white">Creator</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
        <div
          className={`text-sm text-gray-700 dark:text-white ${showFullDescription ? "" : "line-clamp-3"}`}
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
