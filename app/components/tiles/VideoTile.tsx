"use client";

import Link from "next/link";
import Image from "next/image";
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

interface VideoTileProps {
  video: Video;
  showStats?: boolean;
}

export default function VideoTile({ video, showStats = true }: VideoTileProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatCount = (count: number | undefined) => {
    if (!count || count === 0) return "0";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  };

  return (
    <Link href={`/watch/${video._id}`} className="group block">
      <div className="bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]">
        {/* Video Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-700">
          {/* Loading placeholder */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse bg-gray-200 dark:bg-gray-600 w-full h-full" />
            </div>
          )}

          {/* Video Thumbnail Image */}
          {!imageError ? (
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              fill
              className={`object-cover group-hover:scale-110 transition-transform duration-500 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
              <div className="text-4xl text-gray-400">📺</div>
            </div>
          )}

          {/* Duration Badge */}
          <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-sm text-white text-xs px-2 py-1 rounded font-medium">
            {video.duration}
          </div>

          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 transform group-hover:scale-110 transition-transform duration-300">
              <svg
                className="w-8 h-8 text-gray-800 ml-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M8 5v10l8-5z" />
              </svg>
            </div>
          </div>

          {/* Hover overlay with stats */}
          {showStats && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      👁️ {formatCount(video.viewCount || 0)} views
                    </span>
                    <span className="flex items-center gap-1">
                      ⏱️ {video.duration}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Video Info */}
        <div className="p-4">
          {/* Channel Avatar and Info */}
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
              {video.channelAvatar ? (
                <Image
                  src={video.channelAvatar}
                  alt={video.channelName}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                  {video.channelName.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-tight line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors">
                {video.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                {video.channelName}
              </p>
            </div>
          </div>

          {/* Stats and Date */}
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-3">
              <span>{formatCount(video.viewCount || 0)} views</span>
              <span>•</span>
              <span>{formatDate(video.createdAt)}</span>
            </div>
          </div>

          {/* Duration Info */}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                ⏱️ Duration: {video.duration}
              </span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
