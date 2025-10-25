"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface NewsArticle {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  author: {
    name: string;
    avatar?: string;
  };
  featuredImage?: string;
  publishedAt: string;
  updatedAt: string;
  readingTime: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  status: "draft" | "published" | "archived";
  tags?: string[];
  category?: string;
  metadata: {
    featured: boolean;
    trending: boolean;
    breaking: boolean;
  };
  relatedIdols?: Array<{
    _id: string;
    name: string;
    stageName?: string;
  }>;
  relatedGenres?: Array<{
    _id: string;
    name: string;
    color: string;
  }>;
}

interface NewsResponse {
  success: boolean;
  data: NewsArticle[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  stats?: {
    totalArticles: number;
    publishedCount: number;
    featuredCount: number;
    trendingCount: number;
  };
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("publishedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState<NewsResponse["stats"] | null>(null);

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "12",
        sortBy,
        sortOrder,
        includeStats: "true",
        status: "published",
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      if (filterCategory) {
        params.append("category", filterCategory);
      }

      if (filterTag) {
        params.append("tag", filterTag);
      }

      const response = await fetch(`/api/news?${params}`);
      const data: NewsResponse = await response.json();

      if (data.success) {
        setArticles(
          currentPage === 1 ? data.data : [...articles, ...data.data],
        );
        setStats(data.stats);
      } else {
        setError("Failed to load news articles");
      }
    } catch {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    sortBy,
    sortOrder,
    searchTerm,
    categoryFilter,
    statusFilter,
    showAdult,
    articles,
  ]);

  useEffect(() => {
    setArticles([]);
    setCurrentPage(1);
  }, [sortBy, sortOrder, searchTerm, filterCategory, filterTag]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setArticles([]);
    fetchNews();
  };

  const loadMoreArticles = () => {
    setCurrentPage(currentPage + 1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCount = (count: number | undefined) => {
    if (!count || count === 0) return "0";
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  const featuredArticles = articles.filter(
    (article) => article.metadata?.featured,
  );
  const breakingNews = articles.filter((article) => article.metadata?.breaking);
  const trendingArticles = articles.filter(
    (article) => article.metadata?.trending,
  );
  const regularArticles = articles.filter(
    (article) =>
      !article.metadata?.featured &&
      !article.metadata?.breaking &&
      !article.metadata?.trending,
  );

  if (loading && articles.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-64"></div>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-200 dark:bg-gray-700 rounded-lg h-20"
                  ></div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32"
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
            Latest News & Updates
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Stay updated with the latest news, announcements, and insights
          </p>

          {/* Stats */}
          {stats && (
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{stats.publishedCount} published articles</span>
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
                placeholder="Search articles by title, content, or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <input
              type="text"
              placeholder="Category"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent w-36"
            />
            <input
              type="text"
              placeholder="Tag"
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent w-32"
            />
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
              <option value="publishedAt">Sort by Publish Date</option>
              <option value="updatedAt">Sort by Updated Date</option>
              <option value="title">Sort by Title</option>
              <option value="viewCount">Sort by Views</option>
              <option value="likeCount">Sort by Likes</option>
              <option value="commentCount">Sort by Comments</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Breaking News */}
        {breakingNews.length > 0 && (
          <div className="mb-12 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <h2 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
              🚨 Breaking News
            </h2>
            <div className="space-y-3">
              {breakingNews.map((article) => (
                <Link
                  key={article._id}
                  href={`/news/${article.slug}`}
                  className="block group"
                >
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-1">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(article.publishedAt)} •{" "}
                        {article.readingTime} min read
                      </p>
                    </div>
                    <div className="text-red-500 text-xl">📢</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              ⭐ Featured Articles
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredArticles.slice(0, 2).map((article, index) => (
                <Link
                  key={article._id}
                  href={`/news/${article.slug}`}
                  className="group"
                >
                  <article className="bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                    {article.featuredImage && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={article.featuredImage}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-3 text-sm text-gray-500 dark:text-gray-400">
                        <time dateTime={article.publishedAt}>
                          {formatDate(article.publishedAt)}
                        </time>
                        <span>•</span>
                        <span>{article.readingTime} min read</span>
                        <span>•</span>
                        <span>{formatCount(article.viewCount)} views</span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-3 line-clamp-2">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
                          {article.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {article.author.avatar && (
                            <img
                              src={article.author.avatar}
                              alt={article.author.name}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {article.author.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            ❤️ {formatCount(article.likeCount)}
                          </span>
                          <span className="flex items-center gap-1">
                            💬 {formatCount(article.commentCount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Trending Articles */}
        {trendingArticles.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              🔥 Trending Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingArticles.map((article) => (
                <Link
                  key={article._id}
                  href={`/news/${article.slug}`}
                  className="group"
                >
                  <article className="bg-white dark:bg-neutral-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {article.featuredImage && (
                      <div className="aspect-[16/10] overflow-hidden">
                        <img
                          src={article.featuredImage}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2 text-xs text-gray-500 dark:text-gray-400">
                        <time dateTime={article.publishedAt}>
                          {formatDate(article.publishedAt)}
                        </time>
                        <span>•</span>
                        <span>{article.readingTime} min read</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-2 line-clamp-2">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                          {article.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{article.author.name}</span>
                        <div className="flex items-center gap-2">
                          <span>{formatCount(article.viewCount)} views</span>
                          <span>❤️ {formatCount(article.likeCount)}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All Articles */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            {featuredArticles.length > 0 ||
            trendingArticles.length > 0 ||
            breakingNews.length > 0
              ? "All Articles"
              : "Recent Articles"}
          </h2>

          {regularArticles.length > 0 ? (
            <div className="space-y-6">
              {regularArticles.map((article) => (
                <Link
                  key={article._id}
                  href={`/news/${article.slug}`}
                  className="group block"
                >
                  <article className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row gap-4">
                      {article.featuredImage && (
                        <div className="md:w-48 flex-shrink-0">
                          <div className="aspect-video overflow-hidden rounded-lg">
                            <img
                              src={article.featuredImage}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4 mb-2 text-sm text-gray-500 dark:text-gray-400">
                          <time dateTime={article.publishedAt}>
                            {formatDate(article.publishedAt)} •{" "}
                            {formatTime(article.publishedAt)}
                          </time>
                          <span>•</span>
                          <span>{article.readingTime} min read</span>
                          {article.category && (
                            <>
                              <span>•</span>
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                                {article.category}
                              </span>
                            </>
                          )}
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-2 line-clamp-2">
                          {article.title}
                        </h3>
                        {article.excerpt && (
                          <p className="text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                            {article.excerpt}
                          </p>
                        )}

                        {/* Tags */}
                        {article.tags && article.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {article.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                            {article.tags.length > 3 && (
                              <span className="text-xs text-gray-400">
                                +{article.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {article.author.avatar && (
                              <img
                                src={article.author.avatar}
                                alt={article.author.name}
                                className="w-6 h-6 rounded-full"
                              />
                            )}
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {article.author.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>{formatCount(article.viewCount)} views</span>
                            <span className="flex items-center gap-1">
                              ❤️ {formatCount(article.likeCount)}
                            </span>
                            <span className="flex items-center gap-1">
                              💬 {formatCount(article.commentCount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📰</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {searchTerm || filterCategory || filterTag
                  ? "No articles match your search criteria."
                  : "No articles available."}
              </p>
              {(searchTerm || filterCategory || filterTag) && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterCategory("");
                    setFilterTag("");
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Load More Button */}
        {articles.length > 0 && articles.length >= 12 && (
          <div className="text-center py-8">
            <button
              onClick={loadMoreArticles}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Load More Articles"}
            </button>
          </div>
        )}

        {/* Loading indicator */}
        {loading && articles.length > 0 && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Loading more articles...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
