"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  initialSearch: string;
  initialStatus: string;
  initialSortBy: string;
  initialSortOrder: string;
}

export default function IdolsClientFilters({
  initialSearch,
  initialStatus,
  initialSortBy,
  initialSortOrder,
}: Props) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);
  const [filterStatus, setFilterStatus] = useState(initialStatus);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      navigateWithParams();
    }, 500);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortOrder, filterStatus]);

  const navigateWithParams = () => {
    const params = new URLSearchParams();
    if (searchInput) params.set("search", searchInput);
    if (filterStatus !== "all") params.set("status", filterStatus);
    if (sortBy !== "name") params.set("sortBy", sortBy);
    if (sortOrder !== "asc") params.set("sortOrder", sortOrder);

    const queryString = params.toString();
    router.push(`/idols${queryString ? `?${queryString}` : ""}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigateWithParams();
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSortBy("name");
    setSortOrder("asc");
    setFilterStatus("all");
    router.push("/idols");
  };

  const hasFilters = searchInput || filterStatus !== "all";

  return (
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
          onChange={(e) => setSortOrder(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="retired">Retired Only</option>
        </select>

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
