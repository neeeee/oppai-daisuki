import { Metadata } from "next";
import Link from "next/link";
import VideoTile from "@/components/tiles/VideoTile";
import VideosClientFilters from "./VideosClientFilters";
import Pagination from "@/components/Pagination";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://oppai-daisuki.net";

export const metadata: Metadata = {
  title: "Videos - Browse All Gravure Videos",
  description:
    "Browse our complete collection of Japanese gravure idol videos. Watch high-quality gravure content from popular idols.",
  keywords: ["gravure videos", "Japanese idol videos", "gravure streaming", "idol content"],
  openGraph: {
    title: "Videos - Oppai Daisuki",
    description: "Browse our complete collection of Japanese gravure idol videos.",
    url: `${siteUrl}/videos`,
  },
  alternates: {
    canonical: `${siteUrl}/videos`,
  },
};

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

interface VideosResponse {
  success: boolean;
  data: Video[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  stats?: {
    totalVideos: number;
    featuredCount: number;
    trendingCount: number;
  };
}

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    genre?: string;
    tag?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

async function getVideos(searchParams: {
  page?: string;
  search?: string;
  genre?: string;
  tag?: string;
  sortBy?: string;
  sortOrder?: string;
}): Promise<VideosResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || siteUrl;

  const params = new URLSearchParams({
    page: searchParams.page || "1",
    limit: "12",
    sortBy: searchParams.sortBy || "createdAt",
    sortOrder: searchParams.sortOrder || "desc",
    isAdult: "false",
  });

  if (searchParams.search) params.append("search", searchParams.search);
  if (searchParams.genre) params.append("genre", searchParams.genre);
  if (searchParams.tag) params.append("tags", searchParams.tag);

  try {
    const res = await fetch(`${baseUrl}/api/videos?${params}`, {
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

export default async function VideosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const data = await getVideos(params);
  const currentPage = parseInt(params.page || "1", 10);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">All Videos</h1>
              {data.stats && (
                <p className="text-gray-600 dark:text-gray-300">
                  {data.stats.totalVideos?.toLocaleString()} videos available
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
                  <span className="text-gray-900 dark:text-white font-medium">Videos</span>
                </li>
              </ol>
            </nav>
          </div>

          <div className="mt-6 flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>
                Page {currentPage} of {data.pagination.totalPages}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Showing {data.data.length} videos</span>
            </div>
          </div>
        </div>

        {/* Client-side Filters */}
        <VideosClientFilters
          initialSearch={params.search || ""}
          initialGenre={params.genre || ""}
          initialTag={params.tag || ""}
          initialSortBy={params.sortBy || "createdAt"}
          initialSortOrder={params.sortOrder || "desc"}
        />

        {/* Videos Grid */}
        {data.data.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.data.map((video) => (
                <VideoTile key={video._id} video={video} />
              ))}
            </div>

            {/* Server-rendered Pagination with Links */}
            <div className="mt-12">
              <ServerPagination
                currentPage={currentPage}
                totalPages={data.pagination.totalPages}
                baseUrl="/videos"
                searchParams={params}
              />
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📺</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No Videos Found
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {params.search || params.genre || params.tag
                ? "No videos match your search criteria."
                : "There are no videos available at the moment."}
            </p>
            {(params.search || params.genre || params.tag) && (
              <Link
                href="/videos"
                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200"
              >
                Clear filters
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Server-side pagination component with actual links for SEO
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
    if (searchParams.genre) params.set("genre", searchParams.genre);
    if (searchParams.tag) params.set("tag", searchParams.tag);
    if (searchParams.sortBy) params.set("sortBy", searchParams.sortBy);
    if (searchParams.sortOrder) params.set("sortOrder", searchParams.sortOrder);
    return `${baseUrl}?${params.toString()}`;
  };

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <nav className="flex justify-center items-center gap-2" aria-label="Pagination">
      {currentPage > 1 && (
        <Link
          href={buildUrl(currentPage - 1)}
          className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700"
        >
          Previous
        </Link>
      )}

      {pages.map((page, index) =>
        page === "..." ? (
          <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
            ...
          </span>
        ) : (
          <Link
            key={page}
            href={buildUrl(page)}
            className={`px-3 py-2 rounded-lg ${
              currentPage === page
                ? "bg-indigo-600 text-white"
                : "bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700"
            }`}
          >
            {page}
          </Link>
        )
      )}

      {currentPage < totalPages && (
        <Link
          href={buildUrl(currentPage + 1)}
          className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700"
        >
          Next
        </Link>
      )}
    </nav>
  );
}
