import { Metadata } from "next";
import NewsDetailClient from "./NewsDetailClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://oppai-daisuki.net";

interface NewsData {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: string;
  category: string;
  tags?: string[];
  author: {
    name: string;
  };
  publishedAt?: string;
}

async function getNews(id: string): Promise<NewsData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || siteUrl;
    const res = await fetch(`${baseUrl}/api/news/${id}`, {
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
  const article = await getNews(id);

  if (!article) {
    return {
      title: "Article Not Found",
      description: "The requested news article could not be found.",
    };
  }

  const description = article.excerpt
    ? article.excerpt.substring(0, 160)
    : `${article.title} - Latest gravure idol news on Oppai Daisuki`;

  return {
    title: article.title,
    description,
    keywords: [
      "gravure news",
      "Japanese idol news",
      article.category,
      ...(article.tags || []),
    ],
    authors: [{ name: article.author.name }],
    openGraph: {
      title: article.title,
      description,
      type: "article",
      url: `${siteUrl}/news/${article.slug || id}`,
      publishedTime: article.publishedAt,
      authors: [article.author.name],
      images: article.featuredImage
        ? [
            {
              url: article.featuredImage,
              width: 1200,
              height: 630,
              alt: article.title,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: article.featuredImage ? [article.featuredImage] : [],
    },
    alternates: {
      canonical: `${siteUrl}/news/${article.slug || id}`,
    },
  };
}

export default function NewsDetailPage() {
  return <NewsDetailClient />;
}
