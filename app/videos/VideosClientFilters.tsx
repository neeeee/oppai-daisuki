"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  initialSearch: string;
  initialGenre: string;
  initialTag: string;
  initialSortBy: string;
  initialSortOrder: string;
}

export default function VideosClientFilters({
  initialSearch,
  initialGenre,
  initialTag,
  initialSortBy,
  initialSortOrder,
}: Props) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [genreInput, setGenreInput] = useState(initialGenre);
  const [tagInput, setTagInput] = useState(initialTag);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);
  const [showAdult, setShowAdult] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced navigation
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      navigateWithParams();
    }, 500);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortOrder]);

  const navigateWithParams = () => {
    const params = new URLSearchParams();
    if (searchInput) params.set("search", searchInput);
    if (genreInput) params.set("genre", genreInput);
    if (tagInput) params.set("tag", tagInput);
    if (sortBy !== "createdAt") params.set("sortBy", sortBy);
    if (sortOrder !== "desc") params.set("sortOrder", sortOrder);

    const queryString = params.toString();
    router.push(`/videos${queryString ? `?${queryString}` : ""}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigateWithParams();
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setGenreInput("");
    setTagInput("");
    setSortBy("createdAt");
    setSortOrder("desc");
    router.push("/videos");
  };

  const hasFilters = searchInput || genreInput || tagInput;

  return (
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
          onChange={(e) => setSortOrder(e.target.value)}
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

        {hasFilters && (
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
