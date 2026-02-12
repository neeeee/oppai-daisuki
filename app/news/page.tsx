import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import NewsClientFilters from "./NewsClientFilters";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://oppai-daisuki.net";

export const metadata: Metadata = {
  title: "News - Latest Gravure Idol News & Updates",
  description:
    "Stay updated with the latest Japanese gravure idol news, announcements, releases, and industry updates.",
  keywords: ["gravure news", "idol news", "Japanese idol updates", "gravure announcements"],
  openGraph: {
    title: "News - Oppai Daisuki",
    description: "Stay updated with the latest Japanese gravure idol news and announcements.",
    url: `${siteUrl}/news`,
  },
  alternates: {
    canonical: `${siteUrl}/news`,
  },
};

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

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    tag?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

async function getNews(searchParams: {
  page?: string;
  search?: string;
  tag?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: string;
}): Promise<NewsResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || siteUrl;

  const params = new URLSearchParams({
    page: searchParams.page || "1",
    limit: "12",
    sortBy: searchParams.sortBy || "publishedAt",
    sortOrder: searchParams.sortOrder || "desc",
    status: "published",
    includeStats: "true",
  });

  if (searchParams.search) params.append("search", searchParams.search);
  if (searchParams.tag) params.append("tag", searchParams.tag);
  if (searchParams.category) params.append("category", searchParams.category);

  try {
    const res = await fetch(`${baseUrl}/api/news?${params}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return {
        success: false,
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 12,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }

    return res.json();
  } catch {
    return {
      success: false,
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 12,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatCount(count: number | undefined) {
  if (!count || count === 0) return "0";
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

export default async function NewsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const data = await getNews(params);
  const currentPage = parseInt(params.page || "1", 10);

  const featuredArticles = data.data.filter((a) => a.metadata?.featured);
  const breakingNews = data.data.filter((a) => a.metadata?.breaking);
  const regularArticles = data.data.filter(
    (a) => !a.metadata?.featured && !a.metadata?.breaking
  );

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
          {data.stats && (
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{data.stats.publishedCount} published articles</span>
              <span>•</span>
              <span>{data.stats.featuredCount} featured</span>
            </div>
          )}
        </div>

        {/* Client-side Filters */}
        <NewsClientFilters
          initialSearch={params.search || ""}
          initialTag={params.tag || ""}
          initialCategory={params.category || ""}
          initialSortBy={params.sortBy || "publishedAt"}
          initialSortOrder={params.sortOrder || "desc"}
        />

        {/* Breaking News */}
        {breakingNews.length > 0 && (
          <div className="mb-12 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <h2 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
              🚨 Breaking News
            </h2>
            <div className="space-y-3">
              {breakingNews.map((article) => (
                <Link key={article._id} href={`/news/${article.slug}`} className="block group">
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-1">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(article.publishedAt)} • {article.readingTime} min read
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
              {featuredArticles.slice(0, 2).map((article) => (
                <Link key={article._id} href={`/news/${article.slug}`} className="group">
                  <article className="bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                    {article.featuredImage && (
                      <div className="aspect-video overflow-hidden">
                        <Image
                          src={article.featuredImage}
                          alt={article.title}
                          width={800}
                          height={450}
                          className="w-full h-full group-hover:scale-105 md:h-80 object-cover rounded-lg transition-transform duration-300"
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
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {article.author.name}
                        </span>
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

        {/* All Articles */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            {featuredArticles.length > 0 || breakingNews.length > 0
              ? "All Articles"
              : "Recent Articles"}
          </h2>

          {regularArticles.length > 0 ? (
            <>
              <div className="space-y-6">
                {regularArticles.map((article) => (
                  <Link key={article._id} href={`/news/${article.slug}`} className="group block">
                    <article className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row gap-4">
                        {article.featuredImage && (
                          <div className="md:w-48 flex-shrink-0">
                            <div className="aspect-video overflow-hidden rounded-lg">
                              <Image
                                src={article.featuredImage}
                                alt={article.title}
                                width={192}
                                height={108}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-4 mb-2 text-sm text-gray-500 dark:text-gray-400">
                            <time dateTime={article.publishedAt}>
                              {formatDate(article.publishedAt)}
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
                            </div>
                          )}
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {article.author.name}
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>

              {/* Server-rendered Pagination */}
              <div className="mt-12">
                <ServerPagination
                  currentPage={currentPage}
                  totalPages={data.pagination.totalPages}
                  baseUrl="/news"
                  searchParams={params}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📰</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {params.search || params.category || params.tag
                  ? "No articles match your search criteria."
                  : "No articles available."}
              </p>
              {(params.search || params.category || params.tag) && (
                <Link
                  href="/news"
                  className="mt-4 inline-block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  Clear filters
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ServerPagination({
  currentPage,
  totalPages,
  baseUrl,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const buildUrl = (page: number) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    if (searchParams.search) params.set("search", searchParams.search);
    if (searchParams.tag) params.set("tag", searchParams.tag);
    if (searchParams.category) params.set("category", searchParams.category);
    if (searchParams.sortBy) params.set("sortBy", searchParams.sortBy);
    if (searchParams.sortOrder) params.set("sortOrder", searchParams.sortOrder);
    return `${baseUrl}?${params.toString()}`;
  };

  return (
    <nav className="flex justify-center items-center gap-4" aria-label="Pagination">
      {currentPage > 1 && (
        <Link
          href={buildUrl(currentPage - 1)}
          className="px-4 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700"
        >
          Previous
        </Link>
      )}
      <span className="text-gray-700 dark:text-gray-300">
        Page {currentPage} of {totalPages}
      </span>
      {currentPage < totalPages && (
        <Link
          href={buildUrl(currentPage + 1)}
          className="px-4 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700"
        >
          Next
        </Link>
      )}
    </nav>
  );
}
