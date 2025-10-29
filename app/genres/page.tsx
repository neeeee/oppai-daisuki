"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import GenreTile from "../components/tiles/GenreTile";

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
  metadata: {
    featured: boolean;
    trending: boolean;
    popularityScore: number;
  };
  viewCount: number;
  followCount: number;
}

interface GenresResponse {
  success: boolean;
  data: Genre[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  stats: {
    totalGenres: number;
    featuredCount: number;
    trendingCount: number;
  };
}

export default function GenresPage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showAdult, setShowAdult] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState<GenresResponse["stats"] | null>(null);

  const isLoadingRef = useRef(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 500); // Wait 500ms after user stops typing

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchInput]);

  const fetchGenres = useCallback(async () => {
    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        sortBy,
        sortOrder,
        includeStats: "true",
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/genres?${params}`);
      const data: GenresResponse = await response.json();

      if (data.success) {
        // Filter adult content based on user preference
        const filteredGenres = showAdult
          ? data.data
          : data.data.filter((genre) => !genre.isAdult);

        setGenres(filteredGenres);
        setStats(data.stats);
      } else {
        setError("Failed to load genres");
      }
    } catch {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortBy, sortOrder, searchTerm, showAdult]);

  useEffect(() => {
    fetchGenres();
  }, [fetchGenres]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchGenres();
  };

  const featuredGenres = genres.filter((genre) => genre.metadata?.featured);
  const trendingGenres = genres.filter((genre) => genre.metadata?.trending);
  const regularGenres = genres.filter(
    (genre) => !genre.metadata?.featured && !genre.metadata?.trending,
  );

  if (loading && genres.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
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
            Explore Genres
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Content organized by Genre
          </p>

          {/* Stats */}
          {stats && (
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{stats.totalGenres} total genres</span>
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
                placeholder="Search genres..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Search
            </button>
          </form>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Sort by Name</option>
              <option value="viewCount">Sort by Views</option>
              <option value="followCount">Sort by Followers</option>
              <option value="createdAt">Sort by Date</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>

            <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={showAdult}
                onChange={(e) => setShowAdult(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
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

        {/* Featured Genres */}
        {featuredGenres.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              ⭐ Featured Genres
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredGenres.map((genre) => (
                <GenreTile key={genre._id} genre={genre} />
              ))}
            </div>
          </div>
        )}

        {/* Trending Genres */}
        {trendingGenres.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              🔥 Trending Genres
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {trendingGenres.map((genre) => (
                <GenreTile key={genre._id} genre={genre} />
              ))}
            </div>
          </div>
        )}

        {/* All Genres */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            {featuredGenres.length > 0 || trendingGenres.length > 0
              ? "All Genres"
              : "Genres"}
          </h2>

          {regularGenres.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {regularGenres.map((genre) => (
                <GenreTile key={genre._id} genre={genre} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {searchTerm
                  ? "No genres match your search."
                  : "No genres available."}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>

        {/* Loading more indicator */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Loading genres...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
