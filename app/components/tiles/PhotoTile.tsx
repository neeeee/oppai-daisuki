"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import IdolLink from "../../../components/common/IdolLink";

interface Photo {
  _id: string;
  title?: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  altText?: string;
  photographer?: string;
  location?: string;
  tags?: string[];
  dimensions?: {
    width: number;
    height: number;
  };
  fileSize?: number;
  captureDate?: string;
  uploadDate: string;
  viewCount: number;
  likeCount: number;
  downloadCount: number;
  isPublic: boolean;
  isAdult: boolean;
  metadata: {
    featured: boolean;
    trending: boolean;
    qualityScore: number;
  };
  idol?: {
    _id: string;
    name: string;
    stageName?: string;
    slug: string;
  };
  gallery?: {
    _id: string;
    title: string;
  };
}

interface PhotoTileProps {
  photo: Photo;
  showStats?: boolean;
}

export default function PhotoTile({ photo, showStats = true }: PhotoTileProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatCount = (count: number | undefined) => {
    if (!count || count === 0) return "0";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return null;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${bytes}B`;
  };

  const getAspectRatio = () => {
    if (!photo.dimensions) return "aspect-square";
    const { width, height } = photo.dimensions;
    const ratio = width / height;

    if (ratio > 1.5) return "aspect-[3/2]";
    if (ratio > 1.2) return "aspect-[4/3]";
    if (ratio < 0.7) return "aspect-[2/3]";
    if (ratio < 0.8) return "aspect-[3/4]";
    return "aspect-square";
  };

  const displayUrl = photo.thumbnailUrl || photo.imageUrl;

  return (
    <Link href={`/photos/${photo._id}`} className="group block">
      <div className="bg-white dark:bg-neutral-800 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]">
        {/* Photo Container */}
        <div
          className={`relative overflow-hidden bg-gray-100 dark:bg-gray-700 ${getAspectRatio()}`}
        >
          {/* Loading placeholder */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse bg-gray-200 dark:bg-gray-600 w-full h-full" />
            </div>
          )}

          {/* Photo Image */}
          {!imageError ? (
            <div className="absolute inset-0">
              <Image
                src={displayUrl}
                alt={photo.altText || photo.title || "Photo"}
                fill
                className={`object-cover group-hover:scale-110 transition-transform duration-500 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                sizes="(max-width: 768px) 100vw, 400px"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
              <div className="text-4xl text-gray-400">📷</div>
            </div>
          )}

          {/* Overlay badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {photo.metadata?.featured && (
              <div className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                ⭐
              </div>
            )}
            {photo.metadata?.trending && (
              <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                🔥
              </div>
            )}
            {photo.isAdult && (
              <div className="bg-red-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                18+
              </div>
            )}
          </div>

          {/* Photo info overlay */}
          {showStats && (
            <div className="absolute bottom-2 right-2 flex gap-1">
              {photo.dimensions && (
                <div className="bg-black/75 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
                  {photo.dimensions.width}×{photo.dimensions.height}
                </div>
              )}
              {photo.fileSize && (
                <div className="bg-black/75 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
                  {formatFileSize(photo.fileSize)}
                </div>
              )}
            </div>
          )}

          {/* Hover overlay with stats */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 opacity-0 group-hover:opacity-100">
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    👁️ {formatCount(photo.viewCount || 0)}
                  </span>
                  <span className="flex items-center gap-1">
                    ❤️ {formatCount(photo.likeCount || 0)}
                  </span>
                  <span className="flex items-center gap-1">
                    ⬇️ {formatCount(photo.downloadCount || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Photo Info */}
        <div className="p-3">
          {/* Title */}
          {photo.title && (
            <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">
              {photo.title}
            </h3>
          )}

          {/* Idol/Photographer info */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
            {photo.idol && (
              <div className="line-clamp-1">
                <IdolLink
                  idol={photo.idol}
                  className="text-indigo-600 hover:text-indigo-800 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                />
              </div>
            )}
            {photo.photographer && !photo.idol && (
              <span className="line-clamp-1">📸 {photo.photographer}</span>
            )}
            {photo.captureDate && (
              <span className="ml-auto">
                {photo.captureDate
                  ? new Date(photo.captureDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : ""}
              </span>
            )}
          </div>

          {/* Description */}
          {photo.description && (
            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
              {photo.description}
            </p>
          )}

          {/* Tags */}
          {photo.tags && photo.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {photo.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
              {photo.tags.length > 3 && (
                <span className="text-xs text-gray-400">
                  +{photo.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Gallery info */}
          {photo.gallery && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              From: {photo.gallery.title}
            </div>
          )}

          {/* Location */}
          {photo.location && (
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
              📍 {photo.location}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
