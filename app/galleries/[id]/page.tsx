"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ImageModal from "../../components/common/ImageModal";

interface Photo {
  _id: string;
  title?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  altText?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  fileSize?: number;
}

interface Gallery {
  _id: string;
  title: string;
  description?: string;
  slug: string;
  coverPhoto?: string;
  isPublic: boolean;
  photoCount: number;
  tags?: string[];
  category?: string;
  photographer?: string;
  location?: string;
  dateTaken?: string;
  isAdult: boolean;
  viewCount: number;
  likeCount: number;
  downloadCount: number;
  photos: Photo[];
  metadata: {
    featured: boolean;
    trending: boolean;
    qualityScore: number;
  };
  idol?: {
    _id: string;
    name: string;
    stageName?: string;
    avatar?: string;
  };
  genre?: {
    _id: string;
    name: string;
    description?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function GalleryDetailPage() {
  const params = useParams();
  const galleryId = params?.id as string;

  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);


  const fetchGallery = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/galleries/${galleryId}`);
      const data = await response.json();

      if (data.success) {
        setGallery(data.data);
      } else {
        setError(data.message || "Gallery not found");
      }
    } catch {
      setError("Failed to load gallery");
    } finally {
      setLoading(false);
    }
  }, [galleryId]);

  useEffect(() => {
    if (galleryId) {
      fetchGallery();
    }
  }, [galleryId, fetchGallery]);

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleModalNext = () => {
    if (gallery && currentImageIndex < gallery.photos.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handleModalPrevious = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleLike = async () => {
    try {
      await fetch(`/api/galleries/${galleryId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "like" }),
      });

      if (gallery) {
        setGallery({
          ...gallery,
          likeCount: gallery.likeCount + 1,
        });
      }
    } catch {
      // Silently fail like action
    }
  };

  const handleShare = async () => {
    try {
      // Share using Web Share API if available
      if (navigator.share && gallery) {
        await navigator.share({
          title: gallery.title,
          text: gallery.description || gallery.title,
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        // You could show a toast notification here
      }
    } catch (error) {
      (() => {
        import("@/lib/utils/logger").then((m) =>
          m.default.error("Failed to share gallery:", error),
        );
      })();
    }
  };

  const handleImageLike = async (imageId: string) => {
    try {
      await fetch(`/api/photos/${imageId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "like" }),
      });
    } catch (error) {
      (() => {
        import("@/lib/utils/logger").then((m) =>
          m.default.error("Failed to like image:", error),
        );
      })();
    }
  };

  const handleImageDownload = async (imageId: string) => {
    try {
      await fetch(`/api/photos/${imageId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "download" }),
      });

      // Find the image and trigger download
      const image = gallery?.photos.find((p) => p._id === imageId);
      if (image) {
        const link = document.createElement("a");
        link.href = image.imageUrl;
        link.download = image.title || "image";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      (() => {
        import("@/lib/utils/logger").then((m) =>
          m.default.error("Failed to download image:", error),
        );
      })();
    }
  };

  const handleImageShare = async (imageId: string) => {
    try {
      const image = gallery?.photos.find((p) => p._id === imageId);
      if (navigator.share && image) {
        await navigator.share({
          title: image.title || "Image",
          text: `Check out this image from ${gallery?.title}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }

      await fetch(`/api/photos/${imageId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "share" }),
      });
    } catch (error) {
      (() => {
        import("@/lib/utils/logger").then((m) =>
          m.default.error("Failed to share image:", error),
        );
      })();
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg"
                    ></div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !gallery) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🖼️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Gallery Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {error || "The gallery you're looking for doesn't exist."}
          </p>
          <Link
            href="/galleries"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          >
            ← Back to Galleries
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
            href="/galleries"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 flex items-center gap-2"
          >
            ← Back to Galleries
          </Link>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Gallery Grid */}
          <div className="lg:col-span-2">
            {gallery.photos && gallery.photos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {gallery.photos.map((photo, index) => (
                  <div
                    key={photo._id}
                    className="group relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105"
                    onClick={() => handleImageClick(index)}
                  >
                    <Image
                      src={photo.thumbnailUrl || photo.imageUrl}
                      alt={photo.altText || photo.title || `Photo ${index + 1}`}
                      className="w-full h-full object-cover transition-opacity group-hover:opacity-90"
                    />

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white/90 dark:bg-black/90 text-gray-900 dark:text-white px-3 py-1 rounded-full text-sm font-medium">
                          View Image
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📷</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Photos Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  This gallery doesn&#39;t contain any photos.
                </p>
              </div>
            )}
          </div>

          {/* Gallery Info Sidebar */}
          <div className="space-y-6">
            {/* Title and basic info */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {gallery.title}
                  </h1>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {gallery.metadata?.featured && (
                      <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs px-2 py-1 rounded-full font-medium">
                        ⭐ Featured
                      </span>
                    )}
                    {gallery.isAdult && (
                      <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs px-2 py-1 rounded-full font-medium">
                        18+
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {gallery.description && (
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {gallery.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span className="flex items-center gap-1">
                  📷 {gallery.photoCount} photos
                </span>
              </div>

              {/* Created date */}
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Created {formatDate(gallery.createdAt)}
              </div>
            </div>

            {/* Details */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Details
              </h3>

              <div className="space-y-3 text-sm">
                {gallery.idol && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Model:
                    </span>
                    <Link
                      href={`/idols/${gallery.idol._id}`}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 ml-2"
                    >
                      {gallery.idol.stageName || gallery.idol.name}
                    </Link>
                  </div>
                )}

                {gallery.photographer && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Photographer:
                    </span>
                    <span className="text-gray-900 dark:text-white ml-2">
                      {gallery.photographer}
                    </span>
                  </div>
                )}

                {gallery.location && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Location:
                    </span>
                    <span className="text-gray-900 dark:text-white ml-2">
                      {gallery.location}
                    </span>
                  </div>
                )}

                {gallery.dateTaken && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Date Taken:
                    </span>
                    <span className="text-gray-900 dark:text-white ml-2">
                      {formatDate(gallery.dateTaken)}
                    </span>
                  </div>
                )}

                {gallery.category && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Category:
                    </span>
                    <span className="text-gray-900 dark:text-white ml-2">
                      {gallery.category}
                    </span>
                  </div>
                )}

                {gallery.genre && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Genre:
                    </span>
                    <Link
                      href={`/genres/${gallery.genre._id}`}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 ml-2"
                    >
                      {gallery.genre.name}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {gallery.tags && gallery.tags.length > 0 && (
              <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {gallery.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/galleries?tag=${encodeURIComponent(tag)}`}
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
                  ❤️ Like Gallery
                </button>
                <button
                  onClick={handleShare}
                  className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  📤 Share Gallery
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {gallery.photos && gallery.photos.length > 0 && (
        <ImageModal
          images={gallery.photos}
          currentIndex={currentImageIndex}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onNext={handleModalNext}
          onPrevious={handleModalPrevious}
          onLike={handleImageLike}
          onDownload={handleImageDownload}
          onShare={handleImageShare}
        />
      )}
    </div>
  );
}
