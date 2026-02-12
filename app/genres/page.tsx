import { Metadata } from "next";
import Link from "next/link";
import GenreTile from "@/components/tiles/GenreTile";
import GenresClientFilters from "./GenresClientFilters";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://oppai-daisuki.net";

export const metadata: Metadata = {
  title: "Genres - Explore Content Categories",
  description:
    "Explore Japanese gravure content organized by genre. Find videos, photos, and galleries in your favorite categories.",
  keywords: ["gravure genres", "content categories", "gravure types", "idol categories"],
  openGraph: {
    title: "Genres - Oppai Daisuki",
    description: "Explore Japanese gravure content organized by genre.",
    url: `${siteUrl}/genres`,
  },
  alternates: {
    canonical: `${siteUrl}/genres`,
  },
};

interface Genre {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  coverImage?: string;
  contentCounts: {
    photos: number;
    videos: number;
    galleries: number;
    idols: number;
    news: number;
  };
  isAdult: boolean;
  icon?: string;
  metadata: {
    featured: boolean;
    trending: boolean;
    popularityScore: number;
  };
  viewCount: number;
  followCount: number;
}

interface GenresResponse {
  success: boolean;
  data: Genre[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  stats: {
    totalGenres: number;
    featuredCount: number;
    trendingCount: number;
  };
}

interface PageProps {
  searchParams: Promise<{
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

async function getGenres(searchParams: {
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}): Promise<GenresResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || siteUrl;

  const params = new URLSearchParams({
    limit: "20",
    sortBy: searchParams.sortBy || "name",
    sortOrder: searchParams.sortOrder || "asc",
    includeStats: "true",
  });

  if (searchParams.search) params.append("search", searchParams.search);

  try {
    const res = await fetch(`${baseUrl}/api/genres?${params}`, {
      next: { revalidate: 300 }, // 5 minutes - genres don't change often
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
        stats: { totalGenres: 0, featuredCount: 0, trendingCount: 0 },
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
      stats: { totalGenres: 0, featuredCount: 0, trendingCount: 0 },
    };
  }
}

export default async function GenresPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const data = await getGenres(params);

  // Filter out adult content by default for SSR
  const filteredGenres = data.data.filter((genre) => !genre.isAdult);
  const featuredGenres = filteredGenres.filter((genre) => genre.metadata?.featured);
  const regularGenres = filteredGenres.filter((genre) => !genre.metadata?.featured);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Explore Genres</h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Content organized by Genre</p>

          {/* Stats */}
          {data.stats && (
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{data.stats.totalGenres} total genres</span>
              <span>•</span>
              <span>{data.stats.featuredCount} featured</span>
            </div>
          )}
        </div>

        {/* Client-side Filters */}
        <GenresClientFilters
          initialSearch={params.search || ""}
          initialSortBy={params.sortBy || "name"}
          initialSortOrder={params.sortOrder || "asc"}
        />

        {/* Featured Genres */}
        {featuredGenres.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              ⭐ Featured Genres
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredGenres.map((genre) => (
                <GenreTile key={genre._id} genre={genre} />
              ))}
            </div>
          </div>
        )}

        {/* All Genres */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            {featuredGenres.length > 0 ? "All Genres" : "Genres"}
          </h2>

          {regularGenres.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {regularGenres.map((genre) => (
                <GenreTile key={genre._id} genre={genre} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {params.search ? "No genres match your search." : "No genres available."}
              </p>
              {params.search && (
                <Link
                  href="/genres"
                  className="mt-4 inline-block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
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
