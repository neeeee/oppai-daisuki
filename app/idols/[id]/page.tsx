"use client";
import logger from "@/lib/utils/logger";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import GenrePill from "@/components/common/GenrePill";

type IdolData = {
  _id: string;
  name: string;
  stageName?: string;
  slug: string;
  bio?: string;
  profileImage?: string;
  coverImage?: string;
  birthDate?: string;
  birthPlace?: string;
  height?: number;
  measurements?: {
    bust?: number;
    waist?: number;
    hips?: number;
    cupSize?: string;
  };
  bloodType?: string;
  zodiacSign?: string;
  hobbies?: string[];
  specialSkills?: string[];
  careerStart?: string;
  status: string;
  agency?: string;
  socialMedia?: {
    twitter?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    website?: string;
  };
  genres?: Array<{
    _id: string;
    name: string;
    slug: string;
    color?: string;
  }>;
  tags?: string[];
  isVerified: boolean;
  viewCount: number;
  favoriteCount: number;
  photoCount: number;
  videoCount: number;
  galleryCount: number;
  age?: number;
  createdAt: string;
  updatedAt: string;
};

type Photo = {
  _id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  slug: string;
  viewCount: number;
  likeCount: number;
  createdAt: string;
};

type Gallery = {
  _id: string;
  title: string;
  coverPhoto?: string;
  slug: string;
  photoCount: number;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  description?: string;
};

type Video = {
  _id: string;
  title: string;
  thumbnailUrl: string;
  duration: string;
  viewCount: number;
  channelName: string;
  createdAt: string;
};

type RelatedIdol = {
  _id: string;
  name: string;
  stageName?: string;
  slug: string;
  profileImage?: string;
  viewCount: number;
};

type ContentStats = {
  photos: number;
  galleries: number;
  videos: number;
  totalViews: number;
};

export default function IdolProfilePage() {
  const params = useParams();
  const [idol, setIdol] = useState<IdolData | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [relatedIdols, setRelatedIdols] = useState<RelatedIdol[]>([]);
  const [contentStats, setContentStats] = useState<ContentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"videos" | "photos" | "galleries">(
    "videos",
  );

  const fetchIdolData = useCallback(async () => {
    if (!params.id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/idols/${params.id}`);
      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to load idol");
        return;
      }

      setIdol(data.data.idol);
      setPhotos(data.data.content.photos);
      setGalleries(data.data.content.galleries);
      setVideos(data.data.content.videos);
      setRelatedIdols(data.data.relatedIdols);
      setContentStats(data.data.content.stats);
    } catch (err) {
      logger.error("Error fetching idol:", err);
      setError("Failed to load idol data");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchIdolData();
  }, [fetchIdolData]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Loading skeleton */}
        <div className="relative h-64 bg-gray-300 animate-pulse"></div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-8 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-32 bg-gray-300 rounded animate-pulse"></div>
            </div>
            <div className="space-y-4">
              <div className="h-64 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !idol) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || "Idol not found"}
          </h1>
          <Link
            href="/idols"
            className="text-indigo-600 hover:text-indigo-800 underline"
          >
            Back to Idols
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      {/* Hero Section with Cover Image */}
      <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-600">
        {idol.coverImage ? (
          <Image
            src={idol.coverImage}
            alt={`${idol.stageName || idol.name} cover`}
            fill
            className="object-cover opacity-20"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
        )}

        {/* Profile Image Overlay */}
        <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8">
          <div className="flex items-end gap-4">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
              {idol.profileImage ? (
                <Image
                  src={idol.profileImage}
                  alt={idol.stageName || idol.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-400 flex items-center justify-center text-white text-2xl font-bold">
                  {(idol.stageName || idol.name).charAt(0)}
                </div>
              )}
            </div>
            <div className="text-white mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-shadow-lg">
                {idol.stageName || idol.name}
              </h1>
              {idol.stageName && <p className="text-lg">{idol.name}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Content Area */}
          <div className="lg:col-span-2">
            {/* Navigation Tabs */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
              <button
                onClick={() => setActiveTab("videos")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "videos"
                    ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-indigo-300"
                }`}
              >
                Videos ({videos.length})
              </button>
              <button
                onClick={() => setActiveTab("photos")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "photos"
                    ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-indigo-300"
                }`}
              >
                Photos ({photos.length})
              </button>
              <button
                onClick={() => setActiveTab("galleries")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "galleries"
                    ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-indigo-300"
                }`}
              >
                Galleries ({galleries.length})
              </button>
            </div>

            {/* Content Sections */}
            {activeTab === "videos" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.length > 0 ? (
                  videos.map((video) => (
                    <Link
                      key={video._id}
                      href={`/watch/${video._id}`}
                      className="group"
                    >
                      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div className="relative aspect-video">
                          <Image
                            src={video.thumbnailUrl}
                            alt={video.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                            {video.duration}
                          </div>
                          {/* Play button overlay */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                            <div className="bg-white/90 rounded-full p-3">
                              <svg
                                className="w-6 h-6 text-gray-800 ml-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M8 5v10l8-5z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="p-3">
                          <h3 className="font-medium text-sm line-clamp-2 mb-1 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                            {video.title}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {video.channelName}
                          </p>
                          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                            <span>{formatDate(video.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No videos available
                  </div>
                )}
              </div>
            )}

            {activeTab === "photos" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.length > 0 ? (
                  photos.map((photo) => (
                    <Link
                      key={photo._id}
                      href={`/photos/${photo.slug || photo._id}`}
                      className="group"
                    >
                      <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div className="relative aspect-square">
                          <Image
                            src={photo.thumbnailUrl}
                            alt={photo.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="p-2">
                          <h3 className="font-medium text-xs line-clamp-1 mb-1">
                            {photo.title}
                          </h3>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>♥ {formatNumber(photo.likeCount)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No photos available
                  </div>
                )}
              </div>
            )}

            {activeTab === "galleries" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {galleries.length > 0 ? (
                  galleries.map((gallery) => (
                    <Link
                      key={gallery._id}
                      href={`/galleries/${gallery.slug}`}
                      className="group"
                    >
                      <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div className="relative aspect-video">
                          {gallery.coverPhoto ? (
                            <Image
                              src={gallery.coverPhoto}
                              alt={gallery.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                              No Cover Image
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-lg line-clamp-1 mb-1">
                            {gallery.title}
                          </h3>
                          {gallery.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {gallery.description}
                            </p>
                          )}
                          <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>{gallery.photoCount} photos</span>
                            <div className="flex items-center gap-4"></div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No galleries available
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Profile Info */}
          <div className="space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
                Profile Information
              </h2>

              {idol.bio && (
                <div className="mb-4">
                  <p className="text-black text-sm dark:text-white leading-relaxed">
                    {idol.bio}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {idol.age && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-100 text-sm">
                      Age:
                    </span>
                    <span className="text-sm dark:text-gray-100 font-medium">
                      {idol.age}
                    </span>
                  </div>
                )}

                {idol.birthPlace && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-100 text-sm">
                      Birthplace:
                    </span>
                    <span className="text-sm dark:text-gray-100 font-medium">
                      {idol.birthPlace}
                    </span>
                  </div>
                )}

                {idol.height && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-100 text-sm">
                      Height:
                    </span>
                    <span className="text-sm dark:text-gray-100 font-medium">
                      {idol.height} cm
                    </span>
                  </div>
                )}

                {idol.measurements &&
                  (idol.measurements.bust ||
                    idol.measurements.waist ||
                    idol.measurements.hips) && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-100 text-sm">
                        Measurements:
                      </span>
                      <span className="text-sm dark:text-gray-100  font-medium">
                        {[
                          idol.measurements.bust,
                          idol.measurements.waist,
                          idol.measurements.hips,
                        ]
                          .filter(Boolean)
                          .join("-")}
                        {idol.measurements.cupSize &&
                          ` (${idol.measurements.cupSize})`}
                      </span>
                    </div>
                  )}

                {idol.bloodType && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-100 text-sm">
                      Blood Type:
                    </span>
                    <span className="text-sm dark:text-gray-100 font-medium">
                      {idol.bloodType}
                    </span>
                  </div>
                )}

                {idol.zodiacSign && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-100 text-sm">
                      Zodiac:
                    </span>
                    <span className="text-sm font-medium">
                      {idol.zodiacSign}
                    </span>
                  </div>
                )}

                {idol.agency && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-100 text-sm">
                      Agency:
                    </span>
                    <span className="text-sm dark:text-gray-100 font-medium">
                      {idol.agency}
                    </span>
                  </div>
                )}

                {idol.careerStart && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-100 text-sm">
                      Career Start:
                    </span>
                    <span className="text-sm dark:text-gray-100 font-medium">
                      {new Date(idol.careerStart).getFullYear()}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-100 text-sm">
                    Status:
                  </span>
                  <span
                    className={`text-sm dark:text-gray-100 font-medium capitalize ${
                      idol.status === "active"
                        ? "text-green-600"
                        : idol.status === "retired"
                          ? "text-red-600"
                          : "text-yellow-600"
                    }`}
                  >
                    {idol.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Genres */}
            {idol.genres && idol.genres.length > 0 && (
              <div className="bg-white text-gray-500 dark:text-gray-100 dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Genres</h2>
                <div className="flex flex-wrap gap-2">
                  {idol.genres.map((genre) => (
                    <GenrePill key={genre._id} {...genre}></GenrePill>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {idol.tags && idol.tags.length > 0 && (
              <div className="bg-white text-gray-500 dark:text-gray-100 dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {idol.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 dark:bg-indigo-600 dark:text-gray-100 text-xs font-medium text-gray-500"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Hobbies & Skills */}
            {((idol.hobbies && idol.hobbies.length > 0) ||
              (idol.specialSkills && idol.specialSkills.length > 0)) && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Interests & Skills
                </h2>

                {idol.hobbies && idol.hobbies.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Hobbies:
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {idol.hobbies.map((hobby, index) => (
                        <span
                          key={index}
                          className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
                        >
                          {hobby}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {idol.specialSkills && idol.specialSkills.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Special Skills:
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {idol.specialSkills.map((skill, index) => (
                        <span
                          key={index}
                          className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Social Media */}
            {idol.socialMedia &&
              Object.values(idol.socialMedia).some(Boolean) && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-lg dark:text-white font-semibold mb-4">
                    Social Media
                  </h2>
                  <div className="space-y-2">
                    {idol.socialMedia.twitter && (
                      <a
                        href={idol.socialMedia.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm dark:text-indigo-300 text-blue-500 hover:text-blue-700 dark:hover:text-blue-500"
                      >
                        Twitter
                      </a>
                    )}
                    {idol.socialMedia.instagram && (
                      <a
                        href={idol.socialMedia.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm dark:text-indigo-300 text-blue-500 hover:text-blue-700 dark:hover:text-blue-500"
                      >
                        Instagram
                      </a>
                    )}
                    {idol.socialMedia.tiktok && (
                      <a
                        href={idol.socialMedia.tiktok}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm dark:text-indigo-300 text-blue-500 hover:text-blue-700 dark:hover:text-blue-500"
                      >
                        TikTok
                      </a>
                    )}
                    {idol.socialMedia.youtube && (
                      <a
                        href={idol.socialMedia.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm dark:text-indigo-300 text-blue-500 hover:text-blue-700 dark:hover:text-blue-500"
                      >
                        YouTube
                      </a>
                    )}
                    {idol.socialMedia.website && (
                      <a
                        href={idol.socialMedia.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm dark:text-indigo-300 text-blue-500 hover:text-blue-700 dark:hover:text-blue-500"
                      >
                        Website
                      </a>
                    )}
                  </div>
                </div>
              )}

            {/* Stats */}
            {contentStats && (
              <div className="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-100 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Statistics</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">
                      Content Items:
                    </span>
                    <span className="text-sm font-medium">
                      {contentStats.photos +
                        contentStats.galleries +
                        contentStats.videos}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Related Idols */}
            {relatedIdols.length > 0 && (
              <div className="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-100 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Related Idols</h2>
                <div className="space-y-3">
                  {relatedIdols.map((relatedIdol) => (
                    <Link
                      key={relatedIdol._id}
                      href={`/idols/${relatedIdol.slug}`}
                      className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded"
                    >
                      <div className="relative w-10 h-10 rounded-full overflow-hidden">
                        {relatedIdol.profileImage ? (
                          <Image
                            src={relatedIdol.profileImage}
                            alt={relatedIdol.stageName || relatedIdol.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm">
                            {(relatedIdol.stageName || relatedIdol.name).charAt(
                              0,
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium truncate">
                          {relatedIdol.stageName || relatedIdol.name}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
