"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import IdolTile from "../components/tiles/IdolTile";

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
  viewCount: number;
  followCount: number;
}

interface IdolsResponse {
  success: boolean;
  data: Idol[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  stats?: {
    totalIdols: number;
    activeIdols: number;
    retiredIdols: number;
    featuredCount: number;
    verifiedCount: number;
  };
}

export default function IdolsPage() {
  const [idols, setIdols] = useState<Idol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "retired"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState<IdolsResponse["stats"] | null>(null);

  const isLoadingRef = useRef(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search input
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

  const fetchIdols = useCallback(async () => {
    if (isLoadingRef.current) return;

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

      if (filterStatus !== "all") {
        if (filterStatus === "active") {
          params.append("isActive", "true");
          params.append("isRetired", "false");
        } else if (filterStatus === "retired") {
          params.append("isRetired", "true");
        }
      }

      const response = await fetch(`/api/idols?${params}`);
      const data: IdolsResponse = await response.json();

      if (data.success) {
        setIdols(data.data);
        setStats(data.stats);
      } else {
        setError("Failed to load idols");
      }
    } catch {
      setError("Network error occurred");
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [currentPage, sortBy, sortOrder, searchTerm, filterStatus]);

  // Reset when filters change - THIS WAS MISSING!
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, sortOrder, searchTerm, filterStatus]);

  // Fetch idols when dependencies change
  useEffect(() => {
    fetchIdols();
  }, [fetchIdols]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearchTerm("");
  };

  const featuredIdols = idols.filter((idol) => idol.metadata?.featured);
  const verifiedIdols = idols.filter(
    (idol) => idol.metadata?.verified && !idol.metadata?.featured,
  );
  const regularIdols = idols.filter(
    (idol) => !idol.metadata?.featured && !idol.metadata?.verified,
  );

  if (loading && idols.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-200 dark:bg-gray-700 rounded-xl h-96"
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
            Discover Idols
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Idol profiles
          </p>

          {/* Stats */}
          {stats && (
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{stats.totalIdols} total idols</span>
              <span>•</span>
              <span>{stats.activeIdols} active</span>
              <span>•</span>
              <span>{stats.featuredCount} featured</span>
              <span>•</span>
              <span>{stats.verifiedCount} verified</span>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search idols by name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-colors"
            >
              Search
            </button>
          </form>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
            >
              <option value="name">Sort by Name</option>
              <option value="stageName">Sort by Stage Name</option>
              <option value="viewCount">Sort by Views</option>
              <option value="followCount">Sort by Followers</option>
              <option value="popularityScore">Sort by Popularity</option>
              <option value="createdAt">Sort by Date Added</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as "all" | "active" | "retired")
              }
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="retired">Retired Only</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Featured Idols */}
        {featuredIdols.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              ⭐ Featured Idols
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {featuredIdols.map((idol) => (
                <IdolTile key={idol._id} idol={idol} />
              ))}
            </div>
          </div>
        )}

        {/* Verified Idols */}
        {verifiedIdols.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              ✓ Verified Idols
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {verifiedIdols.map((idol) => (
                <IdolTile key={idol._id} idol={idol} />
              ))}
            </div>
          </div>
        )}

        {/* All Idols */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            {featuredIdols.length > 0 || verifiedIdols.length > 0
              ? "All Idols"
              : "Idols"}
          </h2>

          {regularIdols.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {regularIdols.map((idol) => (
                <IdolTile key={idol._id} idol={idol} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {searchTerm
                  ? "No idols match your search."
                  : "No idols available."}
              </p>
              {searchTerm && (
                <button
                  onClick={handleClearFilters}
                  className="mt-4 text-pink-600 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-200"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {idols.length > 0 && (
          <div className="flex justify-center items-center gap-4 mt-12">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-gray-700 dark:text-gray-300">
              Page {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!loading && idols.length < 20}
              className="px-4 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* Loading more indicator */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Loading idols...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
