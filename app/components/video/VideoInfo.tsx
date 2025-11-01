"use client";

import Image from "next/image";
import Link from "next/link";

interface Idol {
  name: string;
  slug: string;
  channelAvatar: string;
}

interface Genre {
  _id: string;
  name: string;
  slug: string;
  color: string;
}

interface Video {
  _id: string;
  title: string;
  channelAvatar: string;
  idol: Idol;
  description: string;
  channelName: string;
  duration: string;
  viewCount: number;
  thumbnailUrl: string;
  videoSourceUrl: string;
  createdAt: string;
  genres: Genre[];
}

interface VideoInfoProps {
  video: Video;
}

export default function VideoInfo({ video }: VideoInfoProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {video.title}
      </h1>

      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-white">
          <span>{formatDate(video.createdAt)}</span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <Link 
          href={`/idols/${video.idol.slug}`} 
          className="flex items-center space-x-3 font-semibold text-gray-900 dark:text-white hover:text-indigo-300"
        > 
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
            {video.channelName}
          </div>
        </Link>
      </div>

      <div className="bg-neutral-200 dark:bg-neutral-800 rounded-lg p-4">
        <div
          className={`text-sm text-gray-700 dark:text-white`}
        >
  
  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
    This video was uploaded on {formatDate(video.createdAt)}<br></br>
    Enjoy this content from {video.channelName}!<br></br>
    {video.description || "No description available."}
  </p>
            {video.genres?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {video.genres.map((genre) => (
              <Link
                key={genre._id}
                href={`/genres/${genre.slug}`}
                className="px-2 py-1 text-xs font-medium rounded transition-transform hover:scale-105 text-white"
                style={{ backgroundColor: genre.color || "#6366f1" }}
              >
                {genre.name}
              </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
