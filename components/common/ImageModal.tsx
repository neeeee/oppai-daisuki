"use client";

import { useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Download, Heart, Share2 } from "lucide-react";

interface Image {
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
  images: Image[];
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
  onLike,
  onDownload,
  onShare,
}: ImageModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const currentImage = images[currentIndex];

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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === modalRef.current) {
      onClose();
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return null;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${bytes}B`;
  };

  if (!isOpen || !currentImage) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
        aria-label="Close modal"
      >
        <X size={24} />
      </button>

      {/* Navigation Arrows */}
      {currentIndex > 0 && (
        <button
          onClick={onPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
          aria-label="Previous image"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {currentIndex < images.length - 1 && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
          aria-label="Next image"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Image Container */}
      <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        <img
          ref={imageRef}
          src={currentImage.imageUrl}
          alt={currentImage.altText || currentImage.title || "Gallery image"}
          className="max-w-full max-h-full object-contain"
          style={{
            aspectRatio: currentImage.dimensions
              ? `${currentImage.dimensions.width}/${currentImage.dimensions.height}`
              : "auto",
          }}
        />

        {/* Image Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          <div className="flex items-end justify-between text-white">
            <div className="flex-1 min-w-0">
              {currentImage.title && (
                <h3 className="text-lg font-semibold mb-1 truncate">
                  {currentImage.title}
                </h3>
              )}

              <div className="flex items-center gap-4 text-sm text-white/80">
                <span>
                  {currentIndex + 1} of {images.length}
                </span>

                {currentImage.dimensions && (
                  <span>
                    {currentImage.dimensions.width}×{currentImage.dimensions.height}
                  </span>
                )}

                {currentImage.fileSize && (
                  <span>{formatFileSize(currentImage.fileSize)}</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-4">
              {onLike && (
                <button
                  onClick={() => onLike(currentImage._id)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Like image"
                >
                  <Heart size={20} />
                </button>
              )}

              {onShare && (
                <button
                  onClick={() => onShare(currentImage._id)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Share image"
                >
                  <Share2 size={20} />
                </button>
              )}

              {onDownload && (
                <button
                  onClick={() => onDownload(currentImage._id)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Download image"
                >
                  <Download size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[80vw]">
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-2 overflow-x-auto">
            {images.map((image, index) => (
              <button
                key={image._id}
                onClick={() => {
                  if (index < currentIndex) {
                    for (let i = 0; i < currentIndex - index; i++) {
                      onPrevious();
                    }
                  } else if (index > currentIndex) {
                    for (let i = 0; i < index - currentIndex; i++) {
                      onNext();
                    }
                  }
                }}
                className={`relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 transition-all ${
                  index === currentIndex
                    ? "ring-2 ring-white scale-110"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={image.thumbnailUrl || image.imageUrl}
                  alt={image.altText || `Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
