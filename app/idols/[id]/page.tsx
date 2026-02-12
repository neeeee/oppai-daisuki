import { Metadata } from "next";
import IdolProfileClient from "./IdolProfileClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://oppai-daisuki.net";

interface IdolData {
  _id: string;
  name: string;
  stageName?: string;
  slug: string;
  bio?: string;
  profileImage?: string;
  tags?: string[];
}

async function getIdol(id: string): Promise<IdolData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || siteUrl;
    const res = await fetch(`${baseUrl}/api/idols/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data.idol : null;
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
  const idol = await getIdol(id);

  if (!idol) {
    return {
      title: "Idol Not Found",
      description: "The requested idol profile could not be found.",
    };
  }

  const displayName = idol.stageName || idol.name;
  const description = idol.bio
    ? idol.bio.substring(0, 160)
    : `${displayName} - Japanese gravure idol profile, photos, videos and galleries on Oppai Daisuki`;

  return {
    title: `${displayName} - Gravure Idol Profile`,
    description,
    keywords: [
      displayName,
      idol.name,
      "gravure idol",
      "Japanese idol",
      "idol profile",
      ...(idol.tags || []),
    ],
    openGraph: {
      title: `${displayName} - Gravure Idol Profile`,
      description,
      type: "profile",
      url: `${siteUrl}/idols/${idol.slug || id}`,
      images: idol.profileImage
        ? [
            {
              url: idol.profileImage,
              width: 400,
              height: 400,
              alt: displayName,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${displayName} - Gravure Idol`,
      description,
      images: idol.profileImage ? [idol.profileImage] : [],
    },
    alternates: {
      canonical: `${siteUrl}/idols/${idol.slug || id}`,
    },
  };
}

export default function IdolProfilePage() {
  return <IdolProfileClient />;
}
