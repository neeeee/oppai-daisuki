"use client";
import { toSafeHtmlForReact } from "@/lib/utils/sanitize";
import logger from "@/lib/utils/logger";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Calendar, User, Eye, Heart, Share2, Clock, Tag } from "lucide-react";

interface NewsArticle {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  author: {
    name: string;
    email?: string;
    avatar?: string;
  };
  featuredImage?: string;
  images?: Array<{
    url: string;
    caption?: string;
    altText?: string;
  }>;
  category: string;
  tags?: string[];
  relatedIdols?: Array<{
    _id: string;
    name: string;
    stageName?: string;
    avatar?: string;
  }>;
  relatedGenres?: Array<{
    _id: string;
    name: string;
    description?: string;
  }>;
  status: string;
  publishedAt?: string;
  isPublic: boolean;
  isFeatured: boolean;
  isBreaking: boolean;
  priority: number;
  engagement: {
    viewCount: number;
    likeCount: number;
    shareCount: number;
    commentCount: number;
  };
  readingTime: number;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export default function NewsDetailPage() {
  const params = useParams();
  const newsId = params?.id as string;

  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticle = useCallback(async () => {
    if (!newsId) return;
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/news/${newsId}`);
      const data = await response.json();

      if (data.success) {
        setArticle(data.data);
        incrementViewCount();
      } else {
        setError(data.message || "Article not found");
      }
    } catch {
      setError("Failed to load article");
    } finally {
      setLoading(false);
    }
  }, [newsId]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  const incrementViewCount = useCallback(async () => {
    try {
      await fetch(`/api/news/${newsId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "view" }),
      });
    } catch {
      // Silently fail - view count increment is not critical
    }
  }, [newsId]);

  const handleLike = async () => {
    try {
      await fetch(`/api/news/${newsId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "like" }),
      });

      if (article) {
        setArticle({
          ...article,
          engagement: {
            ...article.engagement,
            likeCount: article.engagement.likeCount + 1,
          },
        });
      }
    } catch (error) {
      logger.error("Failed to like article:", error);
    }
  };

  const handleShare = async () => {
    try {
      // Share using Web Share API if available
      if (navigator.share && article) {
        await navigator.share({
          title: article.title,
          text: article.excerpt || article.title,
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        // You could show a toast notification here
      }

      // Increment share count
      await fetch(`/api/news/${newsId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "share" }),
      });

      if (article) {
        setArticle({
          ...article,
          engagement: {
            ...article.engagement,
            shareCount: article.engagement.shareCount + 1,
          },
        });
      }
    } catch (error) {
      logger.error("Failed to share article:", error);
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      general: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
      releases:
        "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
      events:
        "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
      interviews:
        "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300",
      announcements:
        "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
      reviews:
        "bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300",
      industry:
        "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300",
      "behind-the-scenes":
        "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300",
      personal: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
      collaborations:
        "bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300",
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-6"></div>
            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-8"></div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📰</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Article Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {error || "The article you're looking for doesn't exist."}
          </p>
          <Link
            href="/news"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          >
            ← Back to News
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Navigation */}
        <nav className="mb-6">
          <Link
            href="/news"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 flex items-center gap-2"
          >
            ← Back to News
          </Link>
        </nav>

        {/* Article Header */}
        <article className="bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-lg">
          {/* Badges */}
          <div className="p-6 pb-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <span
                className={`text-xs px-3 py-1 rounded-full font-medium ${getCategoryColor(article.category)}`}
              >
                {article.category
                  .replace("-", " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>

              {article.isFeatured && (
                <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs px-3 py-1 rounded-full font-medium">
                  ⭐ Featured
                </span>
              )}

              {article.isBreaking && (
                <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs px-3 py-1 rounded-full font-medium animate-pulse">
                  🚨 Breaking
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
              {article.title}
            </h1>

            {/* Excerpt */}
            {article.excerpt && (
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                {article.excerpt}
              </p>
            )}

            {/* Meta information */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-6">
              <div className="flex items-center gap-2">
                <User size={16} />
                <span>
                  By{" "}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {article.author.name}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>
                  {formatDate(article.publishedAt || article.createdAt)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>{article.readingTime} min read</span>
              </div>

              <div className="flex items-center gap-2">
                <Eye size={16} />
                <span>{formatCount(article.engagement.viewCount)} views</span>
              </div>
            </div>

            {/* Engagement Actions */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleLike}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                <Heart size={16} />
                <span>{formatCount(article.engagement.likeCount)}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                <Share2 size={16} />
                <span>{formatCount(article.engagement.shareCount)}</span>
              </button>
            </div>
          </div>

          {/* Featured Image */}
          {article.featuredImage && (
            <div className="px-6">
              <Image
                src={article.featuredImage}
                alt={article.title}
                className="w-full h-64 md:h-80 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Article Content */}
          <div className="p-6 pt-8">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <div
                className="text-gray-900 dark:text-gray-100 leading-relaxed"
                dangerouslySetInnerHTML={toSafeHtmlForReact(article.content, {
                  newlineToBr: true,
                })}
              />
            </div>

            {/* Additional Images */}
            {article.images && article.images.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Gallery
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {article.images.map((image, index) => (
                    <div key={index} className="space-y-2">
                      <Image
                        src={image.url}
                        alt={image.altText || `Image ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      {image.caption && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                          {image.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Idols */}
            {article.relatedIdols && article.relatedIdols.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Featured Idols
                </h3>
                <div className="flex flex-wrap gap-3">
                  {article.relatedIdols.map((idol) => (
                    <Link
                      key={idol._id}
                      href={`/idols/${idol._id}`}
                      className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-2 rounded-lg transition-colors"
                    >
                      {idol.avatar && (
                        <Image
                          src={idol.avatar}
                          alt={idol.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {idol.stageName || idol.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/news?tag=${encodeURIComponent(tag)}`}
                      className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1 rounded-full transition-colors"
                    >
                      <Tag size={12} />#{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Genres */}
            {article.relatedGenres && article.relatedGenres.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Related Genres
                </h3>
                <div className="flex flex-wrap gap-3">
                  {article.relatedGenres.map((genre) => (
                    <Link
                      key={genre._id}
                      href={`/genres/${genre._id}`}
                      className="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 px-3 py-2 rounded-lg transition-colors"
                    >
                      {genre.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Author Info */}
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                About the Author
              </h3>
              <div className="flex items-center gap-4">
                {article.author.avatar && (
                  <Image
                    src={article.author.avatar}
                    alt={article.author.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {article.author.name}
                  </h4>
                  {article.author.email && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {article.author.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
