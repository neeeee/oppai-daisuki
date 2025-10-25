"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import PhotoTile from "../components/tiles/PhotoTile";

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
    slug: string;
    stageName?: string;
  };
  gallery?: {
    _id: string;
    title: string;
  };
}

interface PhotosResponse {
  success: boolean;
  data: Photo[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  stats?: {
    totalPhotos: number;
    featuredCount: number;
    trendingCount: number;
  };
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("uploadDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterTag, setFilterTag] = useState("");
  const [showAdult, setShowAdult] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState<PhotosResponse["stats"] | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "masonry">("masonry");
  
  // Prevent duplicate requests
  const isLoadingRef = useRef(false);

  const fetchPhotos = useCallback(async () => {
    if (isLoadingRef.current) return;
    
    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "24",
        sortBy,
        sortOrder,
        includeStats: "true",
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      if (filterTag) {
        params.append("tag", filterTag);
      }

      if (!showAdult) {
        params.append("isAdult", "false");
      }

      const response = await fetch(`/api/photos?${params}`);
      const data: PhotosResponse = await response.json();

      if (data.success) {
        setPhotos((prevPhotos) => 
          currentPage === 1 ? data.data : [...prevPhotos, ...data.data]
        );
        setStats(data.stats);
      } else {
        setError("Failed to load photos");
      }
    } catch {
      setError("Network error occurred");
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [currentPage, sortBy, sortOrder, searchTerm, filterTag, showAdult]);

  // Reset when filters change
  useEffect(() => {
    setPhotos([]);
    setCurrentPage(1);
  }, [sortBy, sortOrder, searchTerm, filterTag, showAdult]);

  // Fetch photos when dependencies change
  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // These state changes will trigger the effect above
    setCurrentPage(1);
    setPhotos([]);
  };

  const loadMorePhotos = () => {
    setCurrentPage((prev) => prev + 1);
  };

  const featuredPhotos = photos.filter((photo) => photo.metadata?.featured);
  const trendingPhotos = photos.filter((photo) => photo.metadata?.trending);
  const regularPhotos = photos.filter(
    (photo) => !photo.metadata?.featured && !photo.metadata?.trending,
  );

  // Group photos by different criteria for masonry layout
  const getPhotosByCategory = () => {
    if (featuredPhotos.length > 0 || trendingPhotos.length > 0) {
      return { featuredPhotos, trendingPhotos, regularPhotos };
    }
    return { regularPhotos: photos };
  };

  const photoCategories = getPhotosByCategory();

  if (loading && photos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 20 }).map((_, i) => {
                // Use a predictable pattern for skeleton heights to avoid hydration mismatch
                const heights = [
                  280, 320, 240, 300, 260, 340, 220, 360, 250, 330,
                ];
                const height = heights[i % heights.length];
                return (
                  <div
                    key={i}
                    className="bg-gray-200 dark:bg-gray-700 rounded-lg"
                    style={{ height: `${height}px` }}
                  ></div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Photo Gallery
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Discover stunning photography and memorable moments
          </p>

          {/* Stats */}
          {stats && (
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{stats.totalPhotos?.toLocaleString()} total photos</span>
              <span>•</span>
              <span>{stats.featuredCount} featured</span>
              <span>•</span>
              <span>{stats.trendingCount} trending</span>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search photos by title, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <input
              type="text"
              placeholder="Filter by tag"
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent w-48"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
            >
              Search
            </button>
          </form>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="uploadDate">Sort by Upload Date</option>
              <option value="captureDate">Sort by Capture Date</option>
              <option value="title">Sort by Title</option>
              <option value="viewCount">Sort by Views</option>
              <option value="likeCount">Sort by Likes</option>
              <option value="downloadCount">Sort by Downloads</option>
              <option value="qualityScore">Sort by Quality</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>

            <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1 rounded ${
                  viewMode === "grid"
                    ? "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                ⊞
              </button>
              <button
                onClick={() => setViewMode("masonry")}
                className={`p-1 rounded ${
                  viewMode === "masonry"
                    ? "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                ⊟
              </button>
            </div>

            <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={showAdult}
                onChange={(e) => setShowAdult(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm">Show 18+ content</span>
            </label>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Featured Photos */}
        {photoCategories.featuredPhotos &&
          photoCategories.featuredPhotos.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                ⭐ Featured Photos
              </h2>
              <div
                className={`grid gap-4 ${
                  viewMode === "masonry"
                    ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                    : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                }`}
              >
                {photoCategories.featuredPhotos.map((photo) => (
                  <PhotoTile
                    key={photo._id}
                    photo={photo}
                    showStats={viewMode === "masonry"}
                  />
                ))}
              </div>
            </div>
          )}

        {/* Trending Photos */}
        {photoCategories.trendingPhotos &&
          photoCategories.trendingPhotos.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                🔥 Trending Photos
              </h2>
              <div
                className={`grid gap-4 ${
                  viewMode === "masonry"
                    ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                    : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                }`}
              >
                {photoCategories.trendingPhotos.map((photo) => (
                  <PhotoTile
                    key={photo._id}
                    photo={photo}
                    showStats={viewMode === "masonry"}
                  />
                ))}
              </div>
            </div>
          )}

        {/* All Photos */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            {(photoCategories.featuredPhotos &&
              photoCategories.featuredPhotos.length > 0) ||
            (photoCategories.trendingPhotos &&
              photoCategories.trendingPhotos.length > 0)
              ? "All Photos"
              : "Photos"}
          </h2>

          {photoCategories.regularPhotos &&
          photoCategories.regularPhotos.length > 0 ? (
            <div
              className={`grid gap-4 ${
                viewMode === "masonry"
                  ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                  : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
              }`}
            >
              {photoCategories.regularPhotos.map((photo) => (
                <PhotoTile
                  key={photo._id}
                  photo={photo}
                  showStats={viewMode === "masonry"}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📷</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {searchTerm || filterTag
                  ? "No photos match your search criteria."
                  : "No photos available."}
              </p>
              {(searchTerm || filterTag) && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterTag("");
                  }}
                  className="mt-4 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Load More Button */}
        {photos.length > 0 && photos.length >= 30 && (
          <div className="text-center py-8">
            <button
              onClick={loadMorePhotos}
              disabled={loading}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Load More Photos"}
            </button>
          </div>
        )}

        {/* Loading indicator */}
        {loading && photos.length > 0 && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Loading more photos...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
