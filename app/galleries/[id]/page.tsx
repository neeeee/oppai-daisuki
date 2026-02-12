import { Metadata } from "next";
import GalleryDetailClient from "./GalleryDetailClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://oppai-daisuki.net";

interface GalleryData {
  _id: string;
  title: string;
  description?: string;
  slug: string;
  coverPhoto?: string;
  photoCount: number;
  tags?: string[];
  idol?: {
    name: string;
    stageName?: string;
  };
}

async function getGallery(id: string): Promise<GalleryData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || siteUrl;
    const res = await fetch(`${baseUrl}/api/galleries/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const gallery = await getGallery(id);

  if (!gallery) {
    return {
      title: "Gallery Not Found",
      description: "The requested gallery could not be found.",
    };
  }

  const idolName = gallery.idol?.stageName || gallery.idol?.name;
  const description = gallery.description
    ? gallery.description.substring(0, 160)
    : `${gallery.title}${idolName ? ` featuring ${idolName}` : ""} - ${gallery.photoCount} photos on Oppai Daisuki`;

  return {
    title: `${gallery.title} - Photo Gallery`,
    description,
    keywords: [
      "photo gallery",
      "gravure photos",
      gallery.title,
      ...(idolName ? [idolName] : []),
      ...(gallery.tags || []),
    ],
    openGraph: {
      title: `${gallery.title} - Photo Gallery`,
      description,
      type: "website",
      url: `${siteUrl}/galleries/${gallery.slug || id}`,
      images: gallery.coverPhoto
        ? [
            {
              url: gallery.coverPhoto,
              width: 1200,
              height: 630,
              alt: gallery.title,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: gallery.title,
      description,
      images: gallery.coverPhoto ? [gallery.coverPhoto] : [],
    },
    alternates: {
      canonical: `${siteUrl}/galleries/${gallery.slug || id}`,
    },
  };
}

export default function GalleryDetailPage() {
  return <GalleryDetailClient />;
}
