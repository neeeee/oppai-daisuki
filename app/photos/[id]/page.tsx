"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Photo {
  _id: string;
  title?: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  altText?: string;
  photographer?: string;
  location?: string;
  tags?: string[];
  dimensions?: {
    width: number;
    height: number;
  };
  fileSize?: number;
  captureDate?: string;
  uploadDate: string;
  viewCount: number;
  likeCount: number;
  downloadCount: number;
  isPublic: boolean;
  isAdult: boolean;
  metadata: {
    featured: boolean;
    trending: boolean;
    qualityScore: number;
  };
  idol?: {
    _id: string;
    name: string;
    stageName?: string;
  };
  gallery?: {
    _id: string;
    title: string;
  };
}

export default function PhotoDetailPage() {
  const params = useParams();
  const photoId = params?.id as string;

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhoto = useCallback(async () => {
    if (!photoId) return;
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/photos/${photoId}`);
      const data = await response.json();

      if (data.success) {
        setPhoto(data.data);
        // Increment view count
        incrementViewCount();
      } else {
        setError("Photo not found");
      }
    } catch {
      setError("Failed to load photo");
    } finally {
      setLoading(false);
    }
  }, [photoId]);

  useEffect(() => {
    fetchPhoto();
  }, [fetchPhoto]);

  const incrementViewCount = async () => {
    try {
      await fetch(`/api/photos/${photoId}/view`, {
        method: "POST",
      });
    } catch {
      // Silently fail - view count increment is not critical
    }
  };

  const handleLike = async () => {
    try {
      await fetch(`/api/photos/${photoId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "like" }),
      });

      if (photo) {
        setPhoto({
          ...photo,
          likeCount: photo.likeCount + 1,
        });
      }
    } catch (error) {
      (() => {
        import("@/lib/utils/logger").then((m) =>
          m.default.error("Failed to like photo:", error),
        );
      })();
    }
  };

  const handleDownload = async () => {
    try {
      await fetch(`/api/photos/${photoId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "download" }),
      });

      if (photo) {
        setPhoto({
          ...photo,
          downloadCount: photo.downloadCount + 1,
        });
      }

      // Trigger actual download
      if (photo?.imageUrl) {
        const link = document.createElement("a");
        link.href = photo.imageUrl;
        link.download = photo.title || "photo";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      (() => {
        import("@/lib/utils/logger").then((m) =>
          m.default.error("Failed to download photo:", error),
        );
      })();
    }
  };

  const handleShare = async () => {
    try {
      // Share using Web Share API if available
      if (navigator.share && photo) {
        await navigator.share({
          title: photo.title || "Photo",
          text: photo.description || photo.title || "Check out this photo",
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        // You could show a toast notification here
      }

      // Track share action
      await fetch(`/api/photos/${photoId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "share" }),
      });
    } catch (error) {
      (() => {
        import("@/lib/utils/logger").then((m) =>
          m.default.error("Failed to share photo:", error),
        );
      })();
    }
  };

  const formatCount = (count: number | undefined) => {
    if (!count || count === 0) return "0";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return null;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${bytes}B`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !photo) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📷</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Photo Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {error || "The photo you're looking for doesn't exist."}
          </p>
          <Link
            href="/photos"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          >
            ← Back to Photos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <nav className="mb-6">
          <Link
            href="/photos"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 flex items-center gap-2"
          >
            ← Back to Photos
          </Link>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Photo */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-lg">
              <div className="relative">
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}
                <img
                  src={photo.imageUrl}
                  alt={photo.altText || photo.title || "Photo"}
                  className={`w-full h-auto ${imageLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
                  onLoad={() => setImageLoaded(true)}
                />

                {/* Overlay badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {photo.metadata?.featured && (
                    <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      ⭐ Featured
                    </span>
                  )}
                  {photo.metadata?.trending && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      🔥 Trending
                    </span>
                  )}
                  {photo.isAdult && (
                    <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                      18+
                    </span>
                  )}
                </div>

                {/* Photo info overlay */}
                <div className="absolute bottom-4 right-4 flex gap-2">
                  {photo.dimensions && (
                    <span className="bg-black/75 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
                      {photo.dimensions.width}×{photo.dimensions.height}
                    </span>
                  )}
                  {photo.fileSize && (
                    <span className="bg-black/75 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
                      {formatFileSize(photo.fileSize)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Photo Details Sidebar */}
          <div className="space-y-6">
            {/* Title and basic info */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {photo.title || "Untitled Photo"}
              </h1>

              {photo.description && (
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {photo.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span className="flex items-center gap-1">
                  👁️ {formatCount(photo.viewCount)} views
                </span>
                <span className="flex items-center gap-1">
                  ❤️ {formatCount(photo.likeCount)} likes
                </span>
                <span className="flex items-center gap-1">
                  ⬇️ {formatCount(photo.downloadCount)} downloads
                </span>
              </div>

              {/* Upload date */}
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Uploaded {formatDate(photo.uploadDate)}
              </div>
            </div>

            {/* Creator/Photographer info */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Details
              </h3>

              <div className="space-y-3 text-sm">
                {photo.idol && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Model:
                    </span>
                    <Link
                      href={`/idols/${photo.idol._id}`}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 ml-2"
                    >
                      {photo.idol.stageName || photo.idol.name}
                    </Link>
                  </div>
                )}

                {photo.photographer && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Photographer:
                    </span>
                    <span className="text-gray-900 dark:text-white ml-2">
                      {photo.photographer}
                    </span>
                  </div>
                )}

                {photo.location && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Location:
                    </span>
                    <span className="text-gray-900 dark:text-white ml-2">
                      {photo.location}
                    </span>
                  </div>
                )}

                {photo.captureDate && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Captured:
                    </span>
                    <span className="text-gray-900 dark:text-white ml-2">
                      {formatDate(photo.captureDate)}
                    </span>
                  </div>
                )}

                {photo.gallery && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Gallery:
                    </span>
                    <Link
                      href={`/galleries/${photo.gallery._id}`}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 ml-2"
                    >
                      {photo.gallery.title}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {photo.tags && photo.tags.length > 0 && (
              <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {photo.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/photos?tag=${encodeURIComponent(tag)}`}
                      className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1 rounded-full transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={handleLike}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ❤️ Like Photo
                </button>
                <button
                  onClick={handleDownload}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  ⬇️ Download
                </button>
                <button
                  onClick={handleShare}
                  className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  📤 Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
