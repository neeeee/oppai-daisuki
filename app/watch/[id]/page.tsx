"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import VideoPlayer from "@/components/video/VideoPlayer";
import VideoInfo from "@/components/video/VideoInfo";
import RelatedVideos from "@/components/video/RelatedVideos";
import { TheaterModeProvider, useTheaterMode } from "@/components/video/TheaterModeContext";
import Link from "next/link";

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

function WatchPageContent() {
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isTheaterMode } = useTheaterMode();

  const params = useParams();
  const router = useRouter();
  const videoId = params.id as string;

  const fetchVideo = useCallback(async () => {
    if (!videoId) return;
    try {
      const response = await fetch(`/api/videos/${videoId}`);
      const data = await response.json();

      if (data.success) {
        setVideo(data.data);
      } else {
        setError("Video not found");
      }
    } catch (error) {
      setError("Error loading video");
      (() => {
        import("@/lib/utils/logger").then((m) =>
          m.default.error("Error fetching video:", error),
        );
      })();
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  // Keyboard shortcut for theater mode
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-8">
        <div className={`mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
          isTheaterMode ? "max-w-none" : "max-w-7xl"
        }`}>
          <div className="animate-pulse">
            <div className={`bg-gray-200 rounded-lg mb-6 transition-all duration-300 ${
              isTheaterMode ? "aspect-[21/9]" : "aspect-video"
            }`}></div>
            <div className={`transition-all duration-300 ${
              isTheaterMode 
                ? "grid grid-cols-4 gap-8" 
                : "lg:grid lg:grid-cols-3 lg:gap-8"
            }`}>
              <div className={`space-y-6 ${
                isTheaterMode ? "col-span-3" : "lg:col-span-2"
              }`}>
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-40 bg-gray-200 rounded"></div>
              </div>
              <div className={`space-y-4 ${
                isTheaterMode ? "col-span-1" : "lg:col-span-1"
              }`}>
                <div className="h-6 bg-gray-200 rounded"></div>
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-24 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || "Video not found"}
          </h1>
          <p className="text-gray-600 mb-4">
            The video you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <Link
            href="/videos"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Browse All Videos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-8">
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
        isTheaterMode ? "max-w-none" : "max-w-7xl"
      }`}>
        <div className="mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 dark:text-white hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M7.707 14.707a1 1 0 01-1.414 0L2.586 11a2 2 0 010-2.828L6.293 4.465a1 1 0 011.414 1.414L4.414 9H17a1 1 0 110 2H4.414l3.293 3.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            <span>Back</span>
          </button>
        </div>

        <div className={`transition-all duration-300 ${
          isTheaterMode 
            ? "grid grid-cols-4 gap-8" 
            : "lg:grid lg:grid-cols-3 lg:gap-8"
        }`}>
          <div className={`space-y-6 ${
            isTheaterMode ? "col-span-4" : "lg:col-span-2"
          }`}>
            <VideoPlayer
              src={video.videoSourceUrl}
              poster={video.thumbnailUrl}
              title={video.title}
            />

            <div className={isTheaterMode ? "grid grid-cols-4 gap-8" : ""}>
              <div className={isTheaterMode ? "col-span-3" : ""}>
                <VideoInfo video={video} />
              </div>
              
              {isTheaterMode && (
                <div className="col-span-1">
                  <RelatedVideos currentVideoId={videoId} />
                </div>
              )}
            </div>
          </div>

          {!isTheaterMode && (
            <div className="lg:col-span-1 mt-8 lg:mt-0">
              <RelatedVideos currentVideoId={videoId} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WatchPage() {
  return (
    <TheaterModeProvider>
      <WatchPageContent />
    </TheaterModeProvider>
  );
}