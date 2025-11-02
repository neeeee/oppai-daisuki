"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import IdolLink from "../common/IdolLink";

interface PhotoRef {
  _id: string;
  imageUrl?: string;
  thumbnailUrl?: string;
}

interface Gallery {
  _id: string;
  title: string;
  description?: string;
  slug: string;
  coverPhoto?: string;
  photos: (string | PhotoRef)[];
  photoCount: number;
  viewCount: number;
  likeCount: number;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  isAdult: boolean;
  tags?: string[];
  photographer?: string;
  location?: string;
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
  genre?: {
    _id: string;
    name: string;
    slug: string;
    color: string;
  };
}

interface GalleryTileProps {
  gallery: Gallery;
  showPreview?: boolean;
}

export default function GalleryTile({
  gallery,
  showPreview = true,
}: GalleryTileProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);


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


  const previewPhotos = showPreview ? gallery.photos.slice(0, 4) : [];
  const previewUrl = gallery.coverPhoto ||
    (gallery.photos?.length
      ? typeof gallery.photos[0] === "string"
      ? null
      : gallery.photos[0].imageUrl || gallery.photos[0].thumbnailUrl
      : null);
  const fallback = "/placeholder.jpg";
  const imageSrc = previewUrl;

  return (
    <Link href={`/galleries/${gallery.slug}`} className="group block">
      <div className="bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]">
        {/* Main Cover Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-700">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse bg-gray-200 dark:bg-gray-600 w-full h-full" />
            </div>
          )}

          {(gallery.coverPhoto || previewPhotos[0]) && !imageError ? (
            <div className="absolute inset-0">
              <Image
                src={imageSrc?.startsWith("http") ? imageSrc : fallback}
                alt={gallery.title}
                fill
                className={`object-cover group-hover:scale-110 transition-transform duration-500 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                sizes="(max-width: 768px) 100vw, 400px"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-600">
              <div className="text-4xl text-gray-400">🖼️</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {gallery.photoCount > 0 ? `${gallery.photoCount} photos` : "Empty gallery"}
              </div>
            </div>
          )}

          {/* Preview Grid Overlay */}
          {showPreview && previewPhotos.length > 1 && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300">
              <div className="absolute bottom-4 right-4 grid grid-cols-2 gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {previewPhotos.slice(1, 4).map((photo, index) => {
                  const src = typeof photo === "string" ? photo : photo?.thumbnailUrl || photo?.imageUrl || "";
                  return (
                  <div
                    key={index}
                    className="w-8 h-8 rounded-sm overflow-hidden border border-white/50 relative"
                  >
                    {src ? (
                      <Image
                        src={src}
                        alt={`preview ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center text-[10px] text-gray-600">
                        N/A
                      </div>   
                    )}
                  </div>
                );
              })}
                {gallery.photoCount > 4 && (
                  <div className="w-8 h-8 rounded-sm bg-black/75 text-white text-xs flex items-center justify-center">
                    +{gallery.photoCount - 3}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {gallery.metadata?.featured && (
              <div className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                ⭐ Featured
              </div>
            )}
            {gallery.isAdult && (
              <div className="bg-red-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                18+
              </div>
            )}
          </div>

          {/* Photo Count Badge */}
          <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
            📸 {gallery.photos.length}
          </div>
        </div>

        {/* Gallery Info */}
        <div className="p-4">
          {/* Title and Genre */}
          <div className="mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight line-clamp-2 mb-1">
              {gallery.title}
            </h3>
            {gallery.genre && (
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: gallery.genre.color }}
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {gallery.genre.name}
                </span>
              </div>
            )}
          </div>

          {/* Creator/Photographer Info */}
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
            {gallery.idol && (
              <div className="line-clamp-1 flex items-center gap-1">
                <span>👤</span>
                <IdolLink
                  idol={gallery.idol}
                  className="text-indigo-600 hover:text-indigo-800 text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                />
              </div>
            )}
            {gallery.photographer && !gallery.idol && (
              <span className="line-clamp-1">📸 {gallery.photographer}</span>
            )}
            <span className="ml-auto text-xs">
              {formatDate(gallery.createdAt)}
            </span>
          </div>

          {/* Description */}
          {gallery.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
              {gallery.description}
            </p>
          )}

          {/* Location */}
          {gallery.location && (
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-2">
              📍 {gallery.location}
            </div>
          )}

          {/* Tags */}
          {gallery.tags && gallery.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {gallery.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
              {gallery.tags.length > 3 && (
                <span className="text-xs text-gray-400">
                  +{gallery.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
