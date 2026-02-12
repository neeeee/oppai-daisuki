import { Metadata } from "next";
import WatchPageClient from "./WatchPageClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://oppai-daisuki.net";

interface VideoData {
  _id: string;
  title: string;
  description: string;
  channelName: string;
  thumbnailUrl: string;
  duration: string;
  tags?: string[];
}

async function getVideo(id: string): Promise<VideoData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || siteUrl;
    const res = await fetch(`${baseUrl}/api/videos/${id}`, {
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
  const video = await getVideo(id);

  if (!video) {
    return {
      title: "Video Not Found",
      description: "The requested video could not be found.",
    };
  }

  const description = video.description
    ? video.description.substring(0, 160)
    : `Watch ${video.title} - Japanese gravure idol video on Oppai Daisuki`;

  return {
    title: video.title,
    description,
    keywords: [
      "gravure video",
      "Japanese idol",
      video.channelName,
      ...(video.tags || []),
    ],
    openGraph: {
      title: video.title,
      description,
      type: "video.other",
      url: `${siteUrl}/watch/${id}`,
      images: [
        {
          url: video.thumbnailUrl,
          width: 1280,
          height: 720,
          alt: video.title,
        },
      ],
      videos: [
        {
          url: `${siteUrl}/watch/${id}`,
          width: 1280,
          height: 720,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: video.title,
      description,
      images: [video.thumbnailUrl],
    },
    alternates: {
      canonical: `${siteUrl}/watch/${id}`,
    },
  };
}

export default function WatchPage() {
  return <WatchPageClient />;
}
