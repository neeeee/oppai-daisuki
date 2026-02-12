import { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://oppai-daisuki.net";

async function fetchAllIds(endpoint: string): Promise<string[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || siteUrl;
    const res = await fetch(`${baseUrl}/api/${endpoint}?limit=1000`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      return data.data.map((item: { _id?: string; slug?: string }) => 
        item.slug || item._id
      ).filter(Boolean);
    }
    return [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/videos`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/galleries`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/idols`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/genres`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/news`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  // Fetch dynamic content IDs
  const [videoIds, galleryIds, idolIds, genreIds, newsIds] = await Promise.all([
    fetchAllIds("videos"),
    fetchAllIds("galleries"),
    fetchAllIds("idols"),
    fetchAllIds("genres"),
    fetchAllIds("news"),
  ]);

  // Generate dynamic pages
  const videoPages: MetadataRoute.Sitemap = videoIds.map((id) => ({
    url: `${siteUrl}/watch/${id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const galleryPages: MetadataRoute.Sitemap = galleryIds.map((id) => ({
    url: `${siteUrl}/galleries/${id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const idolPages: MetadataRoute.Sitemap = idolIds.map((id) => ({
    url: `${siteUrl}/idols/${id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const genrePages: MetadataRoute.Sitemap = genreIds.map((id) => ({
    url: `${siteUrl}/genres/${id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const newsPages: MetadataRoute.Sitemap = newsIds.map((id) => ({
    url: `${siteUrl}/news/${id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...videoPages,
    ...galleryPages,
    ...idolPages,
    ...genrePages,
    ...newsPages,
  ];
}
