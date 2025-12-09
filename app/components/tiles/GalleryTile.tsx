"use client";

import Link from "next/link";
import Image from "next/image";
import { ImageIcon, Lock } from "lucide-react";
import { useState } from "react";
import IdolLink from "@/components/common/IdolLink"; // Adjust path if needed

// Define types based on your schema
interface GalleryTileProps {
  gallery: {
    _id: string;
    title: string;
    slug: string;
    coverPhoto?: string;
    photoCount?: number;
    isPublic?: boolean;
    idol?: {
      _id: string;
      name: string;
      stageName?: string;
      slug: string;
      profileImage?: string;
    } | null;
  };
  showPreview?: boolean;
  className?: string;
  priority?: boolean;
}

export default function GalleryTile({
  gallery,
  showPreview = false,
  className = "",
  priority = false,
}: GalleryTileProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Helper to determine the display name for the idol
  const idolName = gallery.idol
    ? gallery.idol.stageName || gallery.idol.name
    : null;

  return (
    <div
      className={`group relative flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* --- Image Section --- */}
      <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700 overflow-hidden">
        {gallery.coverPhoto ? (
          <Image
            src={gallery.coverPhoto}
            alt={gallery.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className={`object-cover transition-transform duration-500 ${
              isHovered ? "scale-105" : "scale-100"
            }`}
            priority={priority}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <ImageIcon size={32} />
          </div>
        )}

        {/* Private Badge */}
        {gallery.isPublic === false && (
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded text-xs flex items-center gap-1 z-10">
            <Lock size={12} />
            <span>Private</span>
          </div>
        )}

        {/* Photo Count Badge */}
        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded text-xs font-medium z-10">
          {gallery.photoCount || 0} photos
        </div>
      </div>

      {/* --- Content Section --- */}
      <div className="p-3 flex flex-col flex-1 gap-1">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 text-sm md:text-base leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {gallery.title}
        </h3>

        {gallery.idol && (
          <div className="mt-auto pt-1 relative z-10 pointer-events-auto w-fit">
            <IdolLink 
              idol={gallery.idol} 
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            />
          </div>
        )}
        
        {!gallery.idol && (
          <div className="mt-auto pt-1 text-xs text-gray-400 italic">
            No idol tagged
          </div>
        )}
      </div>

      <Link
        href={`/galleries/${gallery.slug}`}
        className="absolute inset-0 z-0"
        aria-label={`View gallery: ${gallery.title}`}
      />
    </div>
  );
}
