"use client";

import Link from "next/link";

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

interface VideoCardProps {
  video: Video;
}

export default function VideoCard({ video }: VideoCardProps) {
  const formatViewCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
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
    <Link href={`/watch/${video._id}`} className="group">
      <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-200">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
          {/* Duration Badge */}
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {video.duration}
          </div>
        </div>

        {/* Video Info */}
        <div className="p-4">
          <div className="flex items-start space-x-3">
            {/* Channel Avatar */}
            <img
              src={video.channelAvatar}
              alt={video.channelName}
              className="w-8 h-8 rounded-full flex-shrink-0"
            />

            {/* Video Details */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                {video.title}
              </h3>
              <p className="text-sm text-gray-600 mb-1">{video.channelName}</p>
              <div className="flex items-center text-xs text-gray-500 space-x-1">
                <span>{formatViewCount(video.viewCount)} views</span>
                <span>•</span>
                <span>{formatDate(video.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
