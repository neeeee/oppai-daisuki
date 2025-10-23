"use client";

import Link from "next/link";
import { useState } from "react";

interface Genre {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  coverImage?: string;
  contentCounts: {
    photos: number;
    videos: number;
    galleries: number;
    idols: number;
    news: number;
  };
  isAdult: boolean;
  icon?: string;
}

interface GenreTileProps {
  genre: Genre;
}

export default function GenreTile({ genre }: GenreTileProps) {
  const [imageError, setImageError] = useState(false);

  const getTotalContent = () => {
    if (!genre.contentCounts) return 0;
    const {
      photos = 0,
      videos = 0,
      galleries = 0,
      idols = 0,
      news = 0,
    } = genre.contentCounts;
    return photos + videos + galleries + idols + news;
  };

  const getTopContentType = () => {
    if (!genre.contentCounts) return { type: "photos", count: 0 };
    const {
      photos = 0,
      videos = 0,
      galleries = 0,
      idols = 0,
      news = 0,
    } = genre.contentCounts;
    const counts = { photos, videos, galleries, idols, news };
    const maxType = Object.entries(counts).reduce((a, b) =>
      counts[a[0]] > counts[b[0]] ? a : b,
    );
    return { type: maxType[0], count: maxType[1] };
  };

  const formatCount = (count: number | undefined) => {
    if (!count || count === 0) return "0";
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  return (
    <Link href={`/genres/${genre.slug}`} className="group block">
      <div className="bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]">
        {/* Cover Image or Color Background */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {genre.coverImage && !imageError ? (
            <img
              src={genre.coverImage}
              alt={genre.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center relative"
              style={{ backgroundColor: genre.color }}
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/40" />

              {/* Icon or Text */}
              <div className="relative z-10 text-white text-center">
                {genre.icon ? (
                  <div className="text-4xl mb-2">{genre.icon}</div>
                ) : (
                  <div className="text-2xl font-bold">
                    {genre.name.charAt(0)}
                  </div>
                )}
                <div className="text-sm font-medium opacity-90">
                  {genre.name}
                </div>
              </div>
            </div>
          )}

          {/* Adult Content Badge */}
          {genre.isAdult && (
            <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              18+
            </div>
          )}

          {/* Content Count Badge */}
          <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
            {formatCount(getTotalContent())} items
          </div>
        </div>

        {/* Content Info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight line-clamp-2 flex-1">
              {genre.name}
            </h3>
            {genre.icon && genre.coverImage && (
              <div className="text-xl ml-2 flex-shrink-0">{genre.icon}</div>
            )}
          </div>

          {genre.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
              {genre.description}
            </p>
          )}

          {/* Content Breakdown */}
          <div className="space-y-1">
            {getTopContentType().count > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400 capitalize">
                  Most: {getTopContentType().type}
                </span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {formatCount(getTopContentType().count)}
                </span>
              </div>
            )}

            {/* Quick stats for non-zero counts */}
            <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
              {genre.contentCounts?.videos > 0 && (
                <span>{genre.contentCounts.videos} videos</span>
              )}
              {genre.contentCounts?.photos > 0 && (
                <span>{genre.contentCounts.photos} photos</span>
              )}
              {genre.contentCounts?.galleries > 0 && (
                <span>{genre.contentCounts.galleries} galleries</span>
              )}
              {genre.contentCounts?.idols > 0 && (
                <span>{genre.contentCounts.idols} idols</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
