"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";

interface Idol {
  _id: string;
  name: string;
  stageName?: string;
  slug: string;
  profileImage?: string;
  coverImage?: string;
  description?: string;
  birthDate?: string;
  nationality?: string;
  height?: number;
  measurements?: {
    bust?: number;
    waist?: number;
    hips?: number;
  };
  contentCounts: {
    photos: number;
    videos: number;
    galleries: number;
  };
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };
  isActive: boolean;
  isRetired: boolean;
  metadata: {
    featured: boolean;
    verified: boolean;
    trending: boolean;
    popularityScore: number;
  };
}

interface IdolTileProps {
  idol: Idol;
}

export default function IdolTile({ idol }: IdolTileProps) {
  const [imageError, setImageError] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);

  const getTotalContent = () => {
    if (!idol.contentCounts) return 0;
    const { photos = 0, videos = 0, galleries = 0 } = idol.contentCounts;
    return photos + videos + galleries;
  };

  const formatCount = (count: number | undefined) => {
    if (!count || count === 0) return "0";
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  const getAge = () => {
    if (!idol.birthDate) return null;
    const today = new Date();
    const birthDate = new Date(idol.birthDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const displayName = idol.stageName || idol.name;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] group">
      <Link href={`/idols/${idol.slug}`} className="block">
        {/* Cover/Background Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20">
          {idol.coverImage && !imageError ? (
            <Image
              src={idol.coverImage}
              alt={displayName}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 400px"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-6xl text-pink-300 dark:text-pink-600">
                👤
              </div>
            </div>
          )}

          {/* Profile Image Overlay */}
          {idol.profileImage && !profileImageError && (
            <div className="absolute bottom-4 left-4">
              <div className="relative w-16 h-16 rounded-full border-3 border-white shadow-lg overflow-hidden">
                <Image
                  src={idol.profileImage}
                  alt={displayName}
                  fill
                  className="object-cover"
                  sizes="64px"
                  onError={() => setProfileImageError(true)}
                />
              </div>
            </div>
          )}

          {/* Status Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {idol.metadata?.featured && (
              <div className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                ⭐ Featured
              </div>
            )}
            {idol.metadata?.verified && (
              <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                ✓ Verified
              </div>
            )}
            {idol.metadata?.trending && (
              <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                🔥 Trending
              </div>
            )}
            {idol.isRetired && (
              <div className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                Retired
              </div>
            )}
          </div>

          {/* Content Count */}
          <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
            {formatCount(getTotalContent())} items
          </div>
        </div>

        {/* Content Info */}
        <div className="p-4">
          <div className="mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight line-clamp-1">
              {displayName}
            </h3>
            {idol.stageName && idol.name !== idol.stageName && (
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                {idol.name}
              </p>
            )}
          </div>

          {/* Basic Info */}
          <div className="space-y-1 mb-3">
            <div className="flex items-center justify-between text-xs">
              {getAge() && (
                <span className="text-gray-500 dark:text-gray-400">
                  Age: {getAge()}
                </span>
              )}
              {idol.nationality && (
                <span className="text-gray-500 dark:text-gray-400">
                  {idol.nationality}
                </span>
              )}
            </div>
            {idol.height && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Height: {idol.height}cm
              </div>
            )}
          </div>

          {idol.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
              {idol.description}
            </p>
          )}

          {/* Content Breakdown */}
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            {idol.contentCounts?.photos > 0 && (
              <span>{formatCount(idol.contentCounts.photos || 0)} photos</span>
            )}
            {idol.contentCounts?.videos > 0 && (
              <span>{formatCount(idol.contentCounts.videos || 0)} videos</span>
            )}
            {idol.contentCounts?.galleries > 0 && (
              <span>
                {formatCount(idol.contentCounts.galleries || 0)} galleries
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Social Media Links - Outside of Link to avoid nesting */}
      {(idol.socialMedia?.instagram ||
        idol.socialMedia?.twitter ||
        idol.socialMedia?.tiktok) && (
        <div className="flex justify-center gap-3 pb-4 pt-1 border-t border-gray-100 dark:border-gray-700 mx-4">
          {idol.socialMedia.instagram && (
            <a
              href={`${idol.socialMedia.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-500 hover:text-pink-600 text-sm z-10"
            >
              📷
            </a>
          )}
          {idol.socialMedia.twitter && (
            <a
              href={`${idol.socialMedia.twitter}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 text-sm z-10"
            >
              🐦
            </a>
          )}
          {idol.socialMedia.tiktok && (
            <a
              href={`${idol.socialMedia.tiktok}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-800 hover:text-gray-900 dark:text-gray-200 dark:hover:text-gray-100 text-sm z-10"
            >
              🎵
            </a>
          )}
        </div>
      )}
    </div>
  );
}
