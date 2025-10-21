"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import VideoGrid from "../components/video/VideoGrid";
import Pagination from "../components/video/Pagination";

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
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalVideos: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  useEffect(() => {
    fetchVideos(currentPage);
  }, [currentPage]);

  const fetchVideos = async (page: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/videos/paginated?page=${page}&limit=12`,
      );
      const data = await response.json();

      if (data.success) {
        setVideos(data.data.videos);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    router.push(`/videos?page=${page}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Videos</h1>
          {pagination && (
            <p className="mt-2 text-gray-600">
              Showing {pagination.totalVideos} videos
            </p>
          )}
        </div>

        {/* Video Grid */}
        <VideoGrid videos={videos} loading={loading} />

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            hasNextPage={pagination.hasNextPage}
            hasPrevPage={pagination.hasPrevPage}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}
