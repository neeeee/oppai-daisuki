"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import GalleryTile from "../components/tiles/GalleryTile";

interface Gallery {
  _id: string;
  title: string;
  description?: string;
  slug: string;
  coverPhoto?: string;
  photos: string[];
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
    color: string;
  };
}

interface GalleriesResponse {
  success: boolean;
  data: Gallery[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  stats?: {
    totalGalleries: number;
    featuredCount: number;
    trendingCount: number;
    totalPhotos: number;
  };
}

async function getVideoDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration); // duration in seconds (float)
    };

    video.onerror = () => reject(new Error("Failed to load video metadata"));
    video.src = url;
  });
}

export default function GalleriesPage() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [filterTag, setFilterTag] = useState("");

  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showAdult, setShowAdult] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState<GalleriesResponse["stats"] | null>(null);

  // Prevent duplicate requests
  const isLoadingRef = useRef(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>(null);
  const tagTimeoutRef = useRef<null | NodeJS.Timeout>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchInput]);

  useEffect(() => {
    if (tagTimeoutRef.current) {
      clearTimeout(tagTimeoutRef.current);
    }

    tagTimeoutRef.current = setTimeout(() => {
      setFilterTag(tagInput);
    }, 500);

    return () => {
      if (tagTimeoutRef.current) {
        clearTimeout(tagTimeoutRef.current);
      }
    };
  }, [tagInput]);

  const fetchGalleries = useCallback(async () => {
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

      const response = await fetch(`/api/galleries?${params}`);
      const data: GalleriesResponse = await response.json();

      if (data.success) {
        setGalleries((prevGalleries) =>
          currentPage === 1 ? data.data : [...prevGalleries, ...data.data],
        );
        setStats(data.stats);
      } else {
        setError("Failed to load galleries");
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
    setGalleries([]);
    setCurrentPage(1);
  }, [sortBy, sortOrder, searchTerm, filterTag, showAdult]);

  // Fetch galleries when dependencies change
  useEffect(() => {
    fetchGalleries();
  }, [fetchGalleries]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setFilterTag(tagInput);
    setCurrentPage(1);
    setGalleries([]);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setFilterTag("");
  };

  const loadMoreGalleries = () => {
    setCurrentPage((prev) => prev + 1);
  };

  const featuredGalleries = galleries.filter(
    (gallery) => gallery.metadata?.featured,
  );

  const regularGalleries = galleries.filter(
    (gallery) => !gallery.metadata?.featured,
  );

  // Group galleries by different criteria
  const getGalleriesByCategory = () => {
    if (featuredGalleries.length > 0) {
      return { featuredGalleries, regularGalleries };
    }
    return { regularGalleries: galleries };
  };

  const galleryCategories = getGalleriesByCategory();

  if (loading && galleries.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-200 dark:bg-gray-700 rounded-xl h-80"
                ></div>
              ))}
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
            Galleries
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Photo collections and themed galleries
          </p>

          {/* Stats */}
          {stats && (
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{stats.totalGalleries?.toLocaleString()} galleries</span>
              <span>•</span>
              <span>{stats.totalPhotos?.toLocaleString()} photos</span>
              <span>•</span>
              <span>{stats.featuredCount} featured</span>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search galleries by title, description, or photographer..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <input
              type="text"
              placeholder="Filter by tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-48"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              Search
            </button>
          </form>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="createdAt">Sort by Created Date</option>
              <option value="updatedAt">Sort by Updated Date</option>
              <option value="title">Sort by Title</option>
              <option value="photoCount">Sort by Photo Count</option>
              <option value="qualityScore">Sort by Quality</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>

            <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={showAdult}
                onChange={(e) => setShowAdult(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
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

        {/* Featured Galleries */}
        {galleryCategories.featuredGalleries &&
          galleryCategories.featuredGalleries.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                ⭐ Featured Galleries
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {galleryCategories.featuredGalleries.map((gallery) => (
                  <GalleryTile
                    key={gallery._id}
                    gallery={gallery}
                    showPreview={true}
                  />
                ))}
              </div>
            </div>
          )}

        {/* All Galleries */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            {galleryCategories.featuredGalleries &&
            galleryCategories.featuredGalleries.length > 0
              ? "All Galleries"
              : "Galleries"}
          </h2>

          {galleryCategories.regularGalleries &&
          galleryCategories.regularGalleries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {galleryCategories.regularGalleries.map((gallery) => (
                <GalleryTile
                  key={gallery._id}
                  gallery={gallery}
                  showPreview={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🖼️</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {searchTerm || filterTag
                  ? "No galleries match your search criteria."
                  : "No galleries available."}
              </p>
              {(searchTerm || filterTag) && (
                <button
                  onClick={handleClearFilters}
                  className="mt-4 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Load More Button */}
        {galleries.length > 0 && galleries.length >= 24 && (
          <div className="text-center py-8">
            <button
              onClick={loadMoreGalleries}
              disabled={loading}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Load More Galleries"}
            </button>
          </div>
        )}

        {/* Loading indicator */}
        {loading && galleries.length > 0 && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Loading more galleries...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
