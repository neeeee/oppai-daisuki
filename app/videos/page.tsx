"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import VideoTile from "@/components/tiles/VideoTile";
import Link from "next/link";

interface Video {
  _id: string;
  title: string;
  channelAvatar: string;
  channelName: string;
  duration: string;
  viewCount: number;
  thumbnailUrl: string;
  videoSourceUrl: string;
  createdAt: string;
  tags?: string[];
  category?: string;
  isAdult?: boolean;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  itemsPerPage: number;
}

function VideosPageContent() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter states
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [genreInput, setGenreInput] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showAdult, setShowAdult] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const isLoadingRef = useRef(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const genreTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tagTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Debounce category input
  useEffect(() => {
    if (genreTimeoutRef.current) {
      clearTimeout(genreTimeoutRef.current);
    }

    genreTimeoutRef.current = setTimeout(() => {
      setGenreFilter(genreInput);
    }, 500);

    return () => {
      if (genreTimeoutRef.current) {
        clearTimeout(genreTimeoutRef.current);
      }
    };
  }, [genreInput]);

  // Debounce tag input
  useEffect(() => {
    if (tagTimeoutRef.current) {
      clearTimeout(tagTimeoutRef.current);
    }

    tagTimeoutRef.current = setTimeout(() => {
      setTagFilter(tagInput);
    }, 500);

    return () => {
      if (tagTimeoutRef.current) {
        clearTimeout(tagTimeoutRef.current);
      }
    };
  }, [tagInput]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      router.push("/videos?page=1");
    }
  }, [
    searchTerm,
    genreFilter,
    tagFilter,
    sortBy,
    sortOrder,
    showAdult,
    currentPage,
    router,
  ]);

  const fetchVideos = useCallback(async () => {
    if (isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "5",
        sortBy,
        sortOrder,
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      if (genreFilter) {
        params.append("genre", genreFilter);
      }

      if (tagFilter) {
        params.append("tags", tagFilter);
      }

      if (!showAdult) {
        params.append("isAdult", "false");
      }
      const response = await fetch(`/api/videos?${params}`);
      const data = await response.json();

      if (data.success) {
        setVideos(data.data);
        setTotalPages(data.pagination.totalPages);
      } else {
        setError("Failed to load videos");
      }
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError("Failed to load videos");
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [
    currentPage,
    searchTerm,
    genreFilter,
    tagFilter,
    sortBy,
    sortOrder,
    showAdult,
  ]);

  useEffect(() => {
    fetchVideos();
    setCurrentPage(1);
  }, [fetchVideos]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setGenreFilter(genreInput);
    setTagFilter(tagInput);
    router.push("/videos?page=1");
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setGenreInput("");
    setGenreFilter("");
    setTagInput("");
    setTagFilter("");
    setSortBy("createdAt");
    setSortOrder("desc");
    router.push("/videos?page=1");
  };

  const handlePageChange = (page: number) => {
    router.push(`/videos?page=${page}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 7;
    const { currentPage, totalPages } = pagination;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (pagination.hasPrevPage) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-l-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white transition-colors"
        >
          Previous
        </button>,
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm font-medium border-t border-b ${
            i === currentPage
              ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/50 border-indigo-300 dark:border-indigo-600"
              : "text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white"
          } transition-colors`}
        >
          {i}
        </button>,
      );
    }

    if (pagination.hasNextPage) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-r-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white transition-colors"
        >
          Next
        </button>,
      );
    }

    return (
      <div className="flex justify-center mt-12">
        <nav className="inline-flex shadow-sm" aria-label="Pagination">
          {pages}
        </nav>
      </div>
    );
  };

  const renderLoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 24 }, (_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-sm animate-pulse"
        >
          <div className="aspect-video bg-gray-200 dark:bg-gray-700"></div>
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
            <div className="flex justify-between">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                All Videos
              </h1>
              {pagination && !loading && (
                <p className="text-gray-600 dark:text-gray-300">
                  {pagination.totalItems.toLocaleString()} videos available
                </p>
              )}
            </div>

            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                <li>
                  <Link
                    href="/"
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <span className="text-gray-400 mx-2">/</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    Videos
                  </span>
                </li>
              </ol>
            </nav>
          </div>

          {pagination && !loading && (
            <div className="mt-6 flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Showing {videos.length} videos</span>
              </div>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search videos by title..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <input
              type="text"
              placeholder="Category"
              value={genreInput}
              onChange={(e) => setGenreInput(e.target.value)}
              className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-36"
            />
            <input
              type="text"
              placeholder="Tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-32"
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
              <option value="createdAt">Sort by Upload Date</option>
              <option value="title">Sort by Title</option>
              <option value="duration">Sort by Duration</option>
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

            {(searchTerm || genreFilter || tagFilter) && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📺</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Failed to Load Videos
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
            <button
              onClick={() => fetchVideos(currentPage)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && renderLoadingSkeleton()}

        {/* Empty State */}
        {!loading && !error && videos.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📺</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No Videos Found
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {searchTerm || genreFilter || tagFilter
                ? "No videos match your search criteria."
                : "There are no videos available at the moment."}
            </p>
            {(searchTerm || genreFilter || tagFilter) && (
              <button
                onClick={handleClearFilters}
                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Videos Grid */}
        {!loading && !error && videos.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                <VideoTile key={video._id} video={video} />
              ))}
            </div>

            {renderPagination()}
          </>
        )}

        {/* Page Info */}
        {pagination && !loading && videos.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Showing page {pagination.currentPage} of {pagination.totalPages} (
            {pagination.totalItems.toLocaleString()} total videos)
          </div>
        )}
      </div>
    </div>
  );
}

export default function VideosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                Loading videos...
              </p>
            </div>
          </div>
        </div>
      }
    >
      <VideosPageContent />
    </Suspense>
  );
}

