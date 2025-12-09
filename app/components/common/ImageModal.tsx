"use client";

import { useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

interface GalleryImage {
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

interface ImageModalProps {
  images: GalleryImage[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onLike?: (imageId: string) => void;
  onDownload?: (imageId: string) => void;
  onShare?: (imageId: string) => void;
}

export default function ImageModal({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNext,
  onPrevious,
}: ImageModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const currentImage = images[currentIndex];

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      switch (event.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          if (currentIndex > 0) onPrevious();
          break;
        case "ArrowRight":
          if (currentIndex < images.length - 1) onNext();
          break;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, images.length, onClose, onNext, onPrevious]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !currentImage) return null;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return null;
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm"
    >
      {/* Top Bar (Close Button) */}
      <div className="absolute top-0 right-0 z-50 p-4">
        <button
          onClick={onClose}
          className="p-2 bg-black/50 hover:bg-white/20 rounded-full transition-colors text-white"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex flex-col justify-center w-full h-full overflow-hidden">
        {/* Navigation Arrows (Hidden on very small screens, tappable zones otherwise) */}
        {currentIndex > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrevious();
            }}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-40 p-2 md:p-3 bg-black/20 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all"
          >
            <ChevronLeft size={24} className="md:w-8 md:h-8" />
          </button>
        )}
        {currentIndex < images.length - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-40 p-2 md:p-3 bg-black/20 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all"
          >
            <ChevronRight size={24} className="md:w-8 md:h-8" />
          </button>
        )}

        {/* Image Container */}
        {/* We use flex-1 to make this take up all available vertical space remaining */}
        <div
          className="flex-1 relative flex items-center justify-center p-2 md:p-8"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <div className="relative w-full h-full max-w-7xl mx-auto">
            <Image
              src={currentImage.imageUrl}
              alt={
                currentImage.altText || currentImage.title || "Gallery image"
              }
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>
        </div>

        {/* Image Info - Mobile Friendly Layout */}
        <div className="flex-shrink-0 w-full bg-gradient-to-t from-black via-black/90 to-transparent pt-4 pb-2 md:absolute md:bottom-20 md:left-0 md:right-0 md:bg-none md:pointer-events-none">
          <div className="container mx-auto px-4 md:pointer-events-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between text-white/90">
              <div className="mb-2 md:mb-0">
                {currentImage.title && (
                  <h3 className="text-base md:text-xl font-medium truncate mb-1">
                    {currentImage.title}
                  </h3>
                )}
                <div className="flex items-center gap-3 text-xs md:text-sm text-white/60">
                  <span className="font-mono">
                    {currentIndex + 1} / {images.length}
                  </span>
                  {currentImage.dimensions && (
                    <span>
                      {currentImage.dimensions.width} ×{" "}
                      {currentImage.dimensions.height}
                    </span>
                  )}
                  {currentImage.fileSize && (
                    <span>{formatFileSize(currentImage.fileSize)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnails Footer */}
      {images.length > 1 && (
        <div className="flex-shrink-0 w-full h-16 md:h-20 bg-black/80 border-t border-white/10">
          <div className="w-full h-full flex items-center justify-center px-4">
            <div className="flex gap-2 overflow-x-auto no-scrollbar w-full max-w-5xl justify-start md:justify-center px-2 py-2">
              {images.map((img, i) => (
                <button
                  key={img._id}
                  onClick={() =>
                    i !== currentIndex &&
                    (i < currentIndex ? onPrevious() : onNext())
                  }
                  className={`relative flex-shrink-0 transition-all duration-200 rounded-md overflow-hidden ${
                    i === currentIndex
                      ? "w-10 h-10 md:w-14 md:h-14 ring-2 ring-white opacity-100"
                      : "w-10 h-10 md:w-14 md:h-14 opacity-40 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={img.thumbnailUrl || img.imageUrl}
                    alt={img.altText || `Thumbnail ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 40px, 56px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
