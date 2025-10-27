// src/components/gallery/GalleryGrid.tsx
import Image from "next/image";
import Link from "next/link";

interface Gallery {
  _id: string;
  title: string;
  description?: string;
  coverPhoto?: string;
  photoCount: number;
}

interface GalleryGridProps {
  galleries: Gallery[];
}

export default function GalleryGrid({ galleries }: GalleryGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {galleries.map((gallery) => (
        <Link key={gallery._id} href={`/galleries/${gallery._id}`}>
          <div className="group cursor-pointer">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
              {gallery.coverPhoto ? (
                <Image
                  src={gallery.coverPhoto}
                  alt={gallery.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-gray-400">No cover photo</span>
                </div>
              )}
            </div>
            <div className="mt-3">
              <h3 className="font-semibold text-gray-900">{gallery.title}</h3>
              {gallery.description && (
                <p className="text-sm text-gray-600 mt-1">
                  {gallery.description}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {gallery.photoCount} photos
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
