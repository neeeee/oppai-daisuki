"use client";
import logger from "@/lib/utils/logger";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatCount } from "../../lib/utils/dateUtils";

interface Video {
  _id: string;
  title: string;
  channelAvatar: string;
  channelName: string;
  duration: string;
  viewCount: number;
  thumbnailUrl: string;
  createdAt: string;
}

interface RelatedVideosProps {
  currentVideoId: string;
  limit?: number;
}

export default function RelatedVideos({
  currentVideoId,
  limit = 8,
}: RelatedVideosProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRelatedVideos = useCallback(async () => {
    try {
      const response = await fetch(`/api/videos/paginated?limit=${limit}`);
      const data = await response.json();

      if (data.success) {
        // Filter out current video and use deterministic shuffling based on video IDs
        const filtered = data.data.videos
          .filter((video: Video) => video._id !== currentVideoId)
          .sort((a, b) => {
            // Use video ID hash for deterministic but pseudo-random ordering
            const hashA = a._id
              .split("")
              .reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const hashB = b._id
              .split("")
              .reduce((acc, char) => acc + char.charCodeAt(0), 0);
            return hashA - hashB;
          })
          .slice(0, limit);
        setVideos(filtered);
      }
    } catch (error) {
      logger.error("Error fetching related videos:", error);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    fetchRelatedVideos();
  }, [fetchRelatedVideos]);

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

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="animate-pulse flex space-x-3">
            <div className="w-40 h-24 bg-gray-200 rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Related Videos
      </h3>
      <div className="space-y-4">
        {videos.map((video) => (
          <Link
            key={video._id}
            href={`/watch/${video._id}`}
            className="flex space-x-3 group hover:bg-gray-50 p-2 rounded-lg transition-colors"
          >
            <div className="relative flex-shrink-0">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-40 h-24 object-cover rounded group-hover:scale-105 transition-transform"
              />
              <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
                {video.duration}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1 group-hover:text-indigo-600">
                {video.title}
              </h4>
              <div className="flex items-center space-x-2 mb-1">
                <div className="flex items-start gap-2">
                  <div className="relative w-8 h-8 flex-shrink-0">
                    <Image
                      src={video.channelAvatar}
                      alt={video.channelName}
                      fill
                      className="rounded-full object-cover"
                      sizes="32px"
                    />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-white">
                    {video.channelName}
                  </p>
                </div>
              </div>
              <div className="flex items-center text-xs text-gray-500 dark:text-white space-x-1">
                <span>{formatCount(video.viewCount)} views</span>
                <span>•</span>
                <span>{formatDate(video.createdAt)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
