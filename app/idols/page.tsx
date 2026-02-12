import { Metadata } from "next";
import Link from "next/link";
import IdolTile from "@/components/tiles/IdolTile";
import IdolsClientFilters from "./IdolsClientFilters";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://oppai-daisuki.net";

export const metadata: Metadata = {
  title: "Idols - Discover Japanese Gravure Idols",
  description:
    "Discover profiles of Japanese gravure idols. Browse photos, videos, and galleries from your favorite idols.",
  keywords: ["gravure idols", "Japanese idols", "idol profiles", "gravure models"],
  openGraph: {
    title: "Idols - Oppai Daisuki",
    description: "Discover profiles of Japanese gravure idols.",
    url: `${siteUrl}/idols`,
  },
  alternates: {
    canonical: `${siteUrl}/idols`,
  },
};

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

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

async function getIdols(searchParams: {
  page?: string;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
}): Promise<IdolsResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || siteUrl;

  const params = new URLSearchParams({
    page: searchParams.page || "1",
    limit: "20",
    sortBy: searchParams.sortBy || "name",
    sortOrder: searchParams.sortOrder || "asc",
    includeStats: "true",
  });

  if (searchParams.search) params.append("search", searchParams.search);
  if (searchParams.status === "active") {
    params.append("isActive", "true");
    params.append("isRetired", "false");
  } else if (searchParams.status === "retired") {
    params.append("isRetired", "true");
  }

  try {
    const res = await fetch(`${baseUrl}/api/idols?${params}`, {
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
          itemsPerPage: 20,
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
        itemsPerPage: 20,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }
}

export default async function IdolsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const data = await getIdols(params);
  const currentPage = parseInt(params.page || "1", 10);

  const featuredIdols = data.data.filter((idol) => idol.metadata?.featured);
  const verifiedIdols = data.data.filter(
    (idol) => idol.metadata?.verified && !idol.metadata?.featured
  );
  const regularIdols = data.data.filter(
    (idol) => !idol.metadata?.featured && !idol.metadata?.verified
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Discover Idols</h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Idol profiles</p>

          {/* Stats */}
          {data.stats && (
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{data.stats.totalIdols} total idols</span>
              <span>•</span>
              <span>{data.stats.activeIdols} active</span>
              <span>•</span>
              <span>{data.stats.featuredCount} featured</span>
              <span>•</span>
              <span>{data.stats.verifiedCount} verified</span>
            </div>
          )}
        </div>

        {/* Client-side Filters */}
        <IdolsClientFilters
          initialSearch={params.search || ""}
          initialStatus={params.status || "all"}
          initialSortBy={params.sortBy || "name"}
          initialSortOrder={params.sortOrder || "asc"}
        />

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
            {featuredIdols.length > 0 || verifiedIdols.length > 0 ? "All Idols" : "Idols"}
          </h2>

          {regularIdols.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {regularIdols.map((idol) => (
                  <IdolTile key={idol._id} idol={idol} />
                ))}
              </div>

              {/* Server-rendered Pagination */}
              <div className="mt-12">
                <ServerPagination
                  currentPage={currentPage}
                  totalPages={data.pagination.totalPages}
                  baseUrl="/idols"
                  searchParams={params}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {params.search ? "No idols match your search." : "No idols available."}
              </p>
              {params.search && (
                <Link
                  href="/idols"
                  className="mt-4 inline-block text-pink-600 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-200"
                >
                  Clear search
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
    if (searchParams.status) params.set("status", searchParams.status);
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
