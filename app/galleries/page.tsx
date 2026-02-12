import { Metadata } from "next";
import Link from "next/link";
import GalleryTile from "@/components/tiles/GalleryTile";
import GalleriesClientFilters from "./GalleriesClientFilters";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://oppai-daisuki.net";

export const metadata: Metadata = {
  title: "Galleries - Browse Photo Collections",
  description:
    "Browse our extensive collection of Japanese gravure photo galleries. High-quality photo sets from popular idols.",
  keywords: ["gravure galleries", "photo galleries", "Japanese idol photos", "gravure photos"],
  openGraph: {
    title: "Galleries - Oppai Daisuki",
    description: "Browse our extensive collection of Japanese gravure photo galleries.",
    url: `${siteUrl}/galleries`,
  },
  alternates: {
    canonical: `${siteUrl}/galleries`,
  },
};

interface Gallery {
  _id: string;
  title: string;
  description?: string;
  slug: string;
  coverPhoto?: string;
  photos: string[];
  photoCount: number;
  viewCount: number;
  likeCount: number;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  isAdult: boolean;
  tags?: string[];
  photographer?: string;
  location?: string;
  metadata: {
    featured: boolean;
    trending: boolean;
    qualityScore: number;
  };
  idol?: {
    _id: string;
    name: string;
    stageName?: string;
    slug: string;
  };
  genre?: {
    _id: string;
    name: string;
    slug: string;
    color: string;
  };
}

interface GalleriesResponse {
  success: boolean;
  data: Gallery[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  stats?: {
    totalGalleries: number;
    featuredCount: number;
    trendingCount: number;
    totalPhotos: number;
  };
}

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    tag?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

async function getGalleries(searchParams: {
  page?: string;
  search?: string;
  tag?: string;
  sortBy?: string;
  sortOrder?: string;
}): Promise<GalleriesResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || siteUrl;

  const params = new URLSearchParams({
    page: searchParams.page || "1",
    limit: "24",
    sortBy: searchParams.sortBy || "createdAt",
    sortOrder: searchParams.sortOrder || "desc",
    isAdult: "false",
    includeStats: "true",
  });

  if (searchParams.search) params.append("search", searchParams.search);
  if (searchParams.tag) params.append("tag", searchParams.tag);

  try {
    const res = await fetch(`${baseUrl}/api/galleries?${params}`, {
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
          itemsPerPage: 24,
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
        itemsPerPage: 24,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }
}

export default async function GalleriesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const data = await getGalleries(params);
  const currentPage = parseInt(params.page || "1", 10);

  const featuredGalleries = data.data.filter((g) => g.metadata?.featured);
  const regularGalleries = data.data.filter((g) => !g.metadata?.featured);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Galleries</h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Photo collections and themed galleries
          </p>

          {/* Stats */}
          {data.stats && (
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{data.stats.totalGalleries?.toLocaleString()} galleries</span>
              <span>•</span>
              <span>{data.stats.totalPhotos?.toLocaleString()} photos</span>
              <span>•</span>
              <span>{data.stats.featuredCount} featured</span>
            </div>
          )}
        </div>

        {/* Client-side Filters */}
        <GalleriesClientFilters
          initialSearch={params.search || ""}
          initialTag={params.tag || ""}
          initialSortBy={params.sortBy || "createdAt"}
          initialSortOrder={params.sortOrder || "desc"}
        />

        {/* Featured Galleries */}
        {featuredGalleries.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              ⭐ Featured Galleries
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredGalleries.map((gallery) => (
                <GalleryTile key={gallery._id} gallery={gallery} showPreview={true} />
              ))}
            </div>
          </div>
        )}

        {/* All Galleries */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            {featuredGalleries.length > 0 ? "All Galleries" : "Galleries"}
          </h2>

          {regularGalleries.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {regularGalleries.map((gallery) => (
                  <GalleryTile key={gallery._id} gallery={gallery} showPreview={true} />
                ))}
              </div>

              {/* Server-rendered Pagination */}
              <div className="mt-12">
                <ServerPagination
                  currentPage={currentPage}
                  totalPages={data.pagination.totalPages}
                  baseUrl="/galleries"
                  searchParams={params}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🖼️</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {params.search || params.tag
                  ? "No galleries match your search criteria."
                  : "No galleries available."}
              </p>
              {(params.search || params.tag) && (
                <Link
                  href="/galleries"
                  className="mt-4 inline-block text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200"
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
