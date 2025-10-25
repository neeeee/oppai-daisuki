"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Calendar, User, Eye, Clock, Tag } from "lucide-react";

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
  category: string;
  tags?: string[];
  status: string;
  publishedAt?: string;
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
  relatedIdols?: Array<{
    _id: string;
    name: string;
    stageName?: string;
    avatar?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface NewsTileProps {
  article: NewsArticle;
  showStats?: boolean;
  size?: "small" | "medium" | "large";
}

export default function NewsTile({
  article,
  showStats = true,
  size = "medium"
}: NewsTileProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatCount = (count: number | undefined) => {
    if (!count || count === 0) return "0";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      general: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
      releases: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
      events: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
      interviews: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300",
      announcements: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
      reviews: "bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300",
      industry: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300",
      "behind-the-scenes": "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300",
      personal: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
      collaborations: "bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300",
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  const sizeClasses = {
    small: "aspect-[4/3]",
    medium: "aspect-[16/10]",
    large: "aspect-[21/9]"
  };

  return (
    <Link href={`/news/${article.slug || article._id}`} className="group block">
      <article className="bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]">
        {/* Featured Image */}
        {article.featuredImage && (
          <div className={`relative overflow-hidden bg-gray-100 dark:bg-gray-700 ${sizeClasses[size]}`}>
            {/* Loading placeholder */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-pulse bg-gray-200 dark:bg-gray-600 w-full h-full" />
              </div>
            )}

            {/* Featured Image */}
            {!imageError ? (
              <Image
                src={article.featuredImage}
                alt={article.title}
                fill
                className={`object-cover group-hover:scale-110 transition-transform duration-500 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                <div className="text-4xl text-gray-400">📰</div>
              </div>
            )}

            {/* Badges Overlay */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(article.category)}`}>
                {article.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>

              {article.isFeatured && (
                <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  ⭐ Featured
                </span>
              )}

              {article.isBreaking && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                  🚨 Breaking
                </span>
              )}
            </div>

            {/* Reading Time Badge */}
            <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-sm text-white text-xs px-2 py-1 rounded font-medium">
              {article.readingTime} min read
            </div>

            {/* Hover overlay with stats */}
            {showStats && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye size={14} />
                        {formatCount(article.engagement.viewCount)} views
                      </span>
                      <span className="flex items-center gap-1">
                        ❤️ {formatCount(article.engagement.likeCount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Article Content */}
        <div className="p-4">
          {/* Category and badges for articles without featured image */}
          {!article.featuredImage && (
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(article.category)}`}>
                {article.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>

              {article.isFeatured && (
                <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs px-2 py-1 rounded-full font-medium">
                  ⭐ Featured
                </span>
              )}

              {article.isBreaking && (
                <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                  🚨 Breaking
                </span>
              )}
            </div>
          )}

          {/* Title */}
          <h2 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">
            {article.title}
          </h2>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-3 mb-3">
              {article.excerpt}
            </p>
          )}

          {/* Author and Meta */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              {article.author.avatar ? (
                <Image
                  src={article.author.avatar}
                  alt={article.author.name}
                  width={20}
                  height={20}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <User size={12} className="text-gray-500" />
                </div>
              )}
              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                {article.author.name}
              </span>
            </div>

            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <Calendar size={12} />
              <span>{formatDate(article.publishedAt || article.createdAt)}</span>
            </div>
          </div>

          {/* Related Idols */}
          {article.relatedIdols && article.relatedIdols.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">Features:</span>
              <div className="flex flex-wrap gap-1">
                {article.relatedIdols.slice(0, 2).map((idol) => (
                  <span
                    key={idol._id}
                    className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full"
                  >
                    {idol.stageName || idol.name}
                  </span>
                ))}
                {article.relatedIdols.length > 2 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    +{article.relatedIdols.length - 2} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex items-center gap-1 mb-3">
              <Tag size={12} className="text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {article.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-gray-500 dark:text-gray-400"
                  >
                    #{tag}
                  </span>
                ))}
                {article.tags.length > 3 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    +{article.tags.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Stats Footer */}
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye size={12} />
                {formatCount(article.engagement.viewCount)} views
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {article.readingTime} min
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                ❤️ {formatCount(article.engagement.likeCount)}
              </span>
              {article.engagement.commentCount > 0 && (
                <span className="flex items-center gap-1">
                  💬 {formatCount(article.engagement.commentCount)}
                </span>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
