import React from "react";
import Link from "next/link";

interface VideoTileProps {
  id: string;
  thumbnailUrl: string;
  title: string;
  channelName: string;
  channelAvatarUrl: string;
  views: number;
  uploadedTime: string;
  duration?: string;
}

export const VideoTile: React.FC<VideoTileProps> = ({
  id,
  thumbnailUrl,
  title,
  channelName,
  channelAvatarUrl,
  views,
  uploadedTime,
  duration,
}) => {
  const formattedViews = Intl.NumberFormat("en-US", {
    notation: "compact",
  }).format(views);

  return (
    <Link
      href={`/watch/${id}`}
      className="w-full max-w-sm cursor-pointer group"
    >
      <div className="relative overflow-hidden rounded-lg">
        <img
          src={thumbnailUrl}
          alt={title}
          className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {duration && (
          <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded-md">
            {duration}
          </span>
        )}
      </div>

      <div className="flex mt-3">
        <img
          src={channelAvatarUrl}
          alt={channelName}
          className="w-9 h-9 rounded-full mr-3 object-cover"
        />
        <div className="flex-1">
          <h3 className="text-sm font-semibold line-clamp-2 text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">
            {title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {channelName}
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-xs">
            {formattedViews} views • {uploadedTime}
          </p>
        </div>
      </div>
    </Link>
  );
};
