"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import VideoTile from "../../components/tiles/VideoTile";
import PhotoTile from "../../components/tiles/PhotoTile";
import GalleryTile from "../../components/tiles/GalleryTile";
import IdolTile from "../../components/tiles/IdolTile";

type Genre = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  coverImage?: string;
  parentGenre?: {
    _id: string;
    name: string;
    slug: string;
    color?: string;
  };
  subGenres?: Array<{
    _id: string;
    name: string;
    slug: string;
    color?: string;
    description?: string;
  }>;
  tags?: string[];
  contentCounts: {
    photos: number;
    videos: number;
    galleries: number;
    idols: number;
    news: number;
  };
  metadata: {
    featured: boolean;
  };
};

type ContentType = "all" | "videos" | "photos" | "galleries" | "idols";

type Video = {
  _id: string;
  title: string;
  channelAvatar: string;
  channelName: string;
  duration: string;
  viewCount: number;
  thumbnailUrl: string;
  createdAt: string;
};

type Photo = {
  _id: string;
  title?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  slug: string;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  isAdult: boolean;
  idol?: {
    _id: string;
    name: string;
    stageName?: string;
    slug: string;
  };
};

type Gallery = {
  _id: string;
  title: string;
  coverPhoto?: string;
  slug: string;
  photoCount: number;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  description?: string;
  idol?: {
    _id: string;
    name: string;
    stageName?: string;
    slug: string;
  };
};

type Idol = {
  _id: string;
  name: string;
  stageName?: string;
  slug: string;
  profileImage?: string;
  coverImage?: string;
  viewCount: number;
  photoCount: number;
  videoCount: number;
  galleryCount: number;
  metadata: {
    featured: boolean;
    verified: boolean;
  };
};

type Pagination = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export default function GenreDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [genre, setGenre] = useState<Genre | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [idols, setIdols] = useState<Idol[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeTab = (searchParams.get("tab") as ContentType) || "all";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  useEffect(() => {
    if (!params.id) return;
    fetchGenreData();
  }, [params.id, activeTab, currentPage]);

  const fetchGenreData = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = `/api/genres/${params.id}?contentType=${activeTab}&page=${currentPage}&limit=24`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to load genre");
        return;
      }

      setGenre(data.data.genre);
      setVideos(data.data.content.videos || []);
      setPhotos(data.data.content.photos || []);
      setGalleries(data.data.content.galleries || []);
      setIdols(data.data.content.idols || []);
      setPagination(data.data.pagination);
    } catch (err) {
      console.error("Error fetching genre:", err);
      setError("Failed to load genre");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: ContentType) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("tab", tab);
    newSearchParams.delete("page"); // Reset to page 1 when changing tabs
    router.push(`/genres/${params.id}?${newSearchParams.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("page", page.toString());
    router.push(`/genres/${params.id}?${newSearchParams.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getContentCount = (type: ContentType): number => {
    if (!genre) return 0;
    switch (type) {
      case "videos":
        return genre.contentCounts.videos;
      case "photos":
        return genre.contentCounts.photos;
      case "galleries":
        return genre.contentCounts.galleries;
      case "idols":
        return genre.contentCounts.idols;
      default:
        return (
          genre.contentCounts.videos +
          genre.contentCounts.photos +
          genre.contentCounts.galleries +
          genre.contentCounts.idols
        );
    }
  };

  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 7;
    const { currentPage, totalPages } = pagination;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (pagination.hasPrevPage) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
        >
          Previous
        </button>
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm font-medium border-t border-b ${
            i === currentPage
              ? "text-indigo-600 bg-indigo-50 border-indigo-300 dark:bg-indigo-900/50 dark:text-indigo-400 dark:border-indigo-600"
              : "text-gray-500 bg-white border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
          } transition-colors`}
        >
          {i}
        </button>
      );
    }

    if (pagination.hasNextPage) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
        >
          Next
        </button>
      );
    }

    return (
      <div className="flex justify-center mt-12">
        <nav className="inline-flex shadow-sm" aria-label="Pagination">
          {pages}
        </nav>
      </div>
    );
  };

  const renderLoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 24 }, (_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-sm animate-pulse"
        >
          <div className="aspect-video bg-gray-200 dark:bg-gray-700"></div>
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    if (loading) return renderLoadingSkeleton();

    if (error) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📂</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Failed to Load Genre
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => fetchGenreData()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    const hasContent =
      (activeTab === "all" &&
        (videos.length > 0 ||
          photos.length > 0 ||
          galleries.length > 0 ||
          idols.length > 0)) ||
      (activeTab === "videos" && videos.length > 0) ||
      (activeTab === "photos" && photos.length > 0) ||
      (activeTab === "galleries" && galleries.length > 0) ||
      (activeTab === "idols" && idols.length > 0);

    if (!hasContent) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📂</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No Content Yet
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            This genre doesn't have any {activeTab === "all" ? "content" : activeTab} yet.
          </p>
        </div>
      );
    }

    return (
      <>
        {/* All Tab - Show sections for each content type */}
        {activeTab === "all" && (
          <div className="space-y-12">
            {/* Videos Section */}
            {videos.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Videos
                  </h2>
                  <button
                    onClick={() => handleTabChange("videos")}
                    className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 text-sm font-medium"
                  >
                    View All →
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {videos.slice(0, 8).map((video) => (
                    <VideoTile key={video._id} video={video} />
                  ))}
                </div>
              </div>
            )}

            {/* Photos Section */}
            {photos.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Photos
                  </h2>
                  <button
                    onClick={() => handleTabChange("photos")}
                    className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 text-sm font-medium"
                  >
                    View All →
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {photos.slice(0, 12).map((photo) => (
                    <PhotoTile key={photo._id} photo={photo as any} />
                  ))}
                </div>
              </div>
            )}

            {/* Galleries Section */}
            {galleries.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Galleries
                  </h2>
                  <button
                    onClick={() => handleTabChange("galleries")}
                    className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 text-sm font-medium"
                  >
                    View All →
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {galleries.slice(0, 8).map((gallery) => (
                    <GalleryTile key={gallery._id} gallery={gallery as any} />
                  ))}
                </div>
              </div>
            )}

            {/* Idols Section */}
            {idols.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Idols
                  </h2>
                  <button
                    onClick={() => handleTabChange("idols")}
                    className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 text-sm font-medium"
                  >
                    View All →
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {idols.slice(0, 8).map((idol) => (
                    <IdolTile key={idol._id} idol={idol as any} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Videos Tab */}
        {activeTab === "videos" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                <VideoTile key={video._id} video={video} />
              ))}
            </div>
            {renderPagination()}
          </>
        )}

        {/* Photos Tab */}
        {activeTab === "photos" && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {photos.map((photo) => (
                <PhotoTile key={photo._id} photo={photo as any} />
              ))}
            </div>
            {renderPagination()}
          </>
        )}

        {/* Galleries Tab */}
        {activeTab === "galleries" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {galleries.map((gallery) => (
                <GalleryTile key={gallery._id} gallery={gallery as any} />
              ))}
            </div>
            {renderPagination()}
          </>
        )}

        {/* Idols Tab */}
        {activeTab === "idols" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {idols.map((idol) => (
                <IdolTile key={idol._id} idol={idol as any} />
              ))}
            </div>
            {renderPagination()}
          </>
        )}
      </>
    );
  };

  if (loading && !genre) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
        {/* Loading skeleton for header */}
        <div className="relative h-64 bg-gray-300 dark:bg-gray-700 animate-pulse"></div>
        <div className="container mx-auto px-4 py-8">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-4 animate-pulse"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-8 animate-pulse"></div>
          {renderLoadingSkeleton()}
        </div>
      </div>
    );
  }

  if (error && !genre) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || "Genre not found"}
          </h1>
          <Link
            href="/genres"
            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 underline"
          >
            Back to Genres
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      {/* Hero Section */}
      <div
        className="relative h-64 overflow-hidden"
        style={{
          backgroundColor: genre?.color || "#6366f1",
        }}
      >
        {genre?.coverImage ? (
          <Image
            src={genre.coverImage}
            alt={genre.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600"></div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>

        {/* Genre Info Overlay */}
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4 text-white">
              {genre?.icon && (
                <div className="text-6xl">{genre.icon}</div>
              )}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold">{genre?.name}</h1>
                  {genre?.metadata.featured && (
                    <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      ⭐ Featured
                    </span>
                  )}
                </div>
                {genre?.description && (
                  <p className="text-lg opacity-90 max-w-2xl">
                    {genre.description}
                  </p>
                )}
                {genre?.parentGenre && (
                  <div className="mt-2">
                    <Link
                      href={`/genres/${genre.parentGenre.slug}`}
                      className="text-sm opacity-75 hover:opacity-100 transition-opacity"
                    >
                      ← Parent: {genre.parentGenre.name}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Stats Bar */}
      {genre && (
        <div className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: genre.color }}
                  ></div>
                  <span className="text-gray-600 dark:text-gray-300">
                    {getContentCount("all")} total items
                  </span>
                </div>
                <div className="text-gray-400">•</div>
                <div className="text-gray-600 dark:text-gray-300">
                  📺 {genre.contentCounts.videos} videos
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  📸 {genre.contentCounts.photos} photos
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  🖼️ {genre.contentCounts.galleries} galleries
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  👤 {genre.contentCounts.idols} idols
                </div>
              </div>

              {/* Breadcrumb */}
              <nav className="flex text-sm" aria-label="Breadcrumb">
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
                    <Link
                      href="/genres"
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      Genres
                    </Link>
                  </li>
                  <li>
                    <span className="text-gray-400 mx-2">/</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {genre.name}
                    </span>
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Sub Navigation Tabs */}
      <div className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-8 overflow-x-auto">
            <button
              onClick={() => handleTabChange("all")}
              className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === "all"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              All Content
              {genre && (
                <span className="ml-2 text-xs opacity-75">
                  ({getContentCount("all")})
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange("videos")}
              className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === "videos"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              📺 Videos
              {genre && (
                <span className="ml-2 text-xs opacity-75">
                  ({genre.contentCounts.videos})
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange("photos")}
              className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === "photos"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              📸 Photos
              {genre && (
                <span className="ml-2 text-xs opacity-75">
                  ({genre.contentCounts.photos})
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange("galleries")}
              className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === "galleries"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              🖼️ Galleries
              {genre && (
                <span className="ml-2 text-xs opacity-75">
                  ({genre.contentCounts.galleries})
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange("idols")}
              className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === "idols"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              👤 Idols
              {genre && (
                <span className="ml-2 text-xs opacity-75">
                  ({genre.contentCounts.idols})
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {renderContent()}

        {/* Sub-genres Section */}
        {genre?.subGenres && genre.subGenres.length > 0 && activeTab === "all" && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Sub-Genres
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {genre.subGenres.map((subGenre) => (
                <Link
                  key={subGenre._id}
                  href={`/genres/${subGenre.slug}`}
                  className="group bg-white dark:bg-neutral-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: subGenre.color || "#6366f1" }}
                    >
                      {subGenre.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {subGenre.name}
                      </h3>
                      {subGenre.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                          {subGenre.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tags Section */}
        {genre?.tags && genre.tags.length > 0 && activeTab === "all" && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Related Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {genre.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pagination Info */}
        {pagination && !loading && activeTab !== "all" && (
          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Showing page {pagination.currentPage} of {pagination.totalPages} (
            {pagination.totalItems.toLocaleString()} total items)
          </div>
        )}
      </div>
    </div>
  );
}
