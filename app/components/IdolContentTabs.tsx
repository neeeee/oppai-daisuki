"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Pagination from "@/components/Pagination";
import logger from "@/lib/utils/logger";

interface Video {
  _id: string;
  title: string;
  thumbnailUrl: string;
  duration: string;
  viewCount: number;
  createdAt: string;
}

// interface Photo {
//   _id: string;
//   title: string;
//   imageUrl: string;
//   viewCount: number;
//   createdAt: string;
// }

interface Gallery {
  _id: string;
  title: string;
  description?: string;
  coverPhoto?: string;
  photoCount: number;
  viewCount: number;
  createdAt: string;
}

interface IdolContentTabsProps {
  idolId: string;
  initialTab?: "videos" | "galleries";
}

type Tab = "videos" | "galleries";

export default function IdolContentTabs({
  idolId,
  initialTab = "videos",
}: IdolContentTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [loading, setLoading] = useState(false);

  // Videos state
  const [videos, setVideos] = useState<Video[]>([]);
  const [videosPage, setVideosPage] = useState(1);
  const [videosTotalPages, setVideosTotalPages] = useState(1);

  // Photos state
  // const [photos, setPhotos] = useState<Photo[]>([]);
  // const [photosPage, setPhotosPage] = useState(1);
  // const [photosTotalPages, setPhotosTotalPages] = useState(1);

  // Galleries state
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [galleriesPage, setGalleriesPage] = useState(1);
  const [galleriesTotalPages, setGalleriesTotalPages] = useState(1);

  const ITEMS_PER_PAGE = 12;

  // Fetch videos
  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: videosPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        idol: idolId,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      const response = await fetch(`/api/videos?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setVideos(data.data || []);
        setVideosTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      logger.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  }, [idolId, videosPage]);

  // Fetch photos
  // const fetchPhotos = useCallback(async () => {
  //   setLoading(true);
  //   try {
  //     const params = new URLSearchParams({
  //       page: photosPage.toString(),
  //       limit: ITEMS_PER_PAGE.toString(),
  //       idol: idolId,
  //       sortBy: "createdAt",
  //       sortOrder: "desc",
  //     });
  //
  //     const response = await fetch(`/api/photos?${params.toString()}`);
  //     const data = await response.json();
  //
  //     if (data.success) {
  //       setPhotos(data.data || []);
  //       setPhotosTotalPages(data.pagination?.totalPages || 1);
  //     }
  //   } catch (error) {
  //     logger.error("Error fetching photos:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [idolId, photosPage]);

  // Fetch galleries
  const fetchGalleries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: galleriesPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        idol: idolId,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      const response = await fetch(`/api/galleries?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setGalleries(data.data || []);
        setGalleriesTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      logger.error("Error fetching galleries:", error);
    } finally {
      setLoading(false);
    }
  }, [idolId, galleriesPage]);

  // Fetch data when tab changes or page changes
  useEffect(() => {
    if (activeTab === "videos") {
      fetchVideos();
    } 
    // else if (activeTab === "photos") {
    //   fetchPhotos(); }
    else if (activeTab === "galleries") {
      fetchGalleries();
    }
  }, [activeTab, fetchVideos, fetchGalleries]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatNumber = (num?: number) => {
    if (num == null) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("videos")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "videos"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Videos
          </button>
          <button
            onClick={() => setActiveTab("galleries")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "galleries"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Galleries
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Videos Tab */}
            {activeTab === "videos" && (
              <>
                {videos.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No videos found
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {videos.map((video) => (
                        <Link
                          key={video._id}
                          href={`/watch/${video._id}`}
                          className="group"
                        >
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 mb-2">
                            <Image
                              src={video.thumbnailUrl}
                              alt={video.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-200"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                            />
                            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded">
                              {video.duration}
                            </div>
                          </div>
                          <h3 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 mb-1">
                            {video.title}
                          </h3>
                        </Link>
                      ))}
                    </div>
                    <Pagination
                      currentPage={videosPage}
                      totalPages={videosTotalPages}
                      onPageChange={setVideosPage}
                      className="mt-8"
                    />
                  </>
                )}
              </>
            )}
            {/* Galleries Tab */}
            {activeTab === "galleries" && (
              <>
                {galleries.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No galleries found
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {galleries.map((gallery) => (
                        <Link
                          key={gallery._id}
                          href={`/galleries/${gallery._id}`}
                          className="group"
                        >
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 mb-3">
                            {gallery.coverPhoto ? (
                              <Image
                                src={gallery.coverPhoto}
                                alt={gallery.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-200"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                No cover
                              </div>
                            )}
                            <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                              {gallery.photoCount} photos
                            </div>
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 mb-1">
                            {gallery.title}
                          </h3>
                          {gallery.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                              {gallery.description}
                            </p>
                          )}
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-2">
                            <span>{formatNumber(gallery.viewCount)} views</span>
                            <span>•</span>
                            <span>{formatDate(gallery.createdAt)}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <Pagination
                      currentPage={galleriesPage}
                      totalPages={galleriesTotalPages}
                      onPageChange={setGalleriesPage}
                      className="mt-8"
                    />
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
