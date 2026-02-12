import Link from "next/link";
import VideoTile from "@/components/tiles/VideoTile";
import GalleryTile from "@/components/tiles/GalleryTile";
import NewsTile from "@/components/tiles/NewsTile";
import HomeContentFilter from "@/components/HomeContentFilter";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://oppai-daisuki.net";

interface Video {
  _id: string;
  title: string;
  channelAvatar: string;
  channelName: string;
  duration: string;
  viewCount: number;
  thumbnailUrl: string;
  videoSourceUrl: string;
  createdAt: string;
}

interface Gallery {
  _id: string;
  title: string;
  description?: string;
  slug: string;
  coverPhoto?: string;
  photos: string[];
  photoCount: number;
  viewCount: number;
  likeCount: number;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  isAdult: boolean;
  tags?: string[];
  photographer?: string;
  location?: string;
  metadata: {
    featured: boolean;
    trending: boolean;
    qualityScore: number;
  };
  idol?: {
    _id: string;
    name: string;
    stageName?: string;
    slug: string;
  };
  genre?: {
    _id: string;
    name: string;
    color: string;
  };
}

interface NewsArticle {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  author: {
    name: string;
    email?: string;
    avatar?: string;
  };
  featuredImage?: string;
  category: string;
  tags?: string[];
  status: string;
  publishedAt?: string;
  isFeatured: boolean;
  isBreaking: boolean;
  priority: number;
  engagement: {
    viewCount: number;
    likeCount: number;
    shareCount: number;
    commentCount: number;
  };
  readingTime: number;
  relatedIdols?: Array<{
    _id: string;
    name: string;
    stageName?: string;
    avatar?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface HomePageData {
  videos: Video[];
  galleries: Gallery[];
  news: NewsArticle[];
  stats: {
    totalVideos: number;
    totalGalleries: number;
    totalNews: number;
  };
}

async function getHomePageData(): Promise<HomePageData> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || siteUrl;
  
  try {
    const [videosRes, galleriesRes, newsRes] = await Promise.all([
      fetch(`${baseUrl}/api/videos?limit=6&sortBy=createdAt&sortOrder=desc`, {
        next: { revalidate: 60 }, // Revalidate every minute
      }),
      fetch(`${baseUrl}/api/galleries?limit=6&sortBy=createdAt&sortOrder=desc`, {
        next: { revalidate: 60 },
      }),
      fetch(`${baseUrl}/api/news?limit=6&sortBy=publishedAt&sortOrder=desc&status=published`, {
        next: { revalidate: 60 },
      }),
    ]);

    const [videosData, galleriesData, newsData] = await Promise.all([
      videosRes.ok ? videosRes.json() : { success: false },
      galleriesRes.ok ? galleriesRes.json() : { success: false },
      newsRes.ok ? newsRes.json() : { success: false },
    ]);

    return {
      videos: videosData.success ? videosData.data : [],
      galleries: galleriesData.success ? galleriesData.data : [],
      news: newsData.success ? newsData.data : [],
      stats: {
        totalVideos: videosData.pagination?.totalItems || 0,
        totalGalleries: galleriesData.pagination?.totalItems || 0,
        totalNews: newsData.pagination?.totalItems || 0,
      },
    };
  } catch (error) {
    console.error("Error fetching homepage data:", error);
    return {
      videos: [],
      galleries: [],
      news: [],
      stats: { totalVideos: 0, totalGalleries: 0, totalNews: 0 },
    };
  }
}

function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

export default async function HomePage() {
  const data = await getHomePageData();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
              Oppai Daisuki
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Your ultimate destination for Japanese gravure idol content
          </p>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCount(data.stats.totalVideos)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Videos</div>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatCount(data.stats.totalGalleries)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Galleries</div>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCount(data.stats.totalNews)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">News</div>
            </div>
          </div>

          {/* Section Filter - Client Component for interactivity */}
          <HomeContentFilter />
        </div>

        {/* Content Sections */}
        <div className="space-y-12">
          {/* Latest Videos */}
          {data.videos.length > 0 && (
            <section data-section="videos">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📹</div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Latest Videos
                  </h2>
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm px-2 py-1 rounded-full">
                    {data.videos.length} new
                  </span>
                </div>
                <Link
                  href="/videos"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium"
                >
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.videos.map((video) => (
                  <VideoTile key={video._id} video={video} />
                ))}
              </div>
            </section>
          )}

          {/* Latest News */}
          {data.news.length > 0 && (
            <section data-section="news">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📰</div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Latest News
                  </h2>
                  <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-sm px-2 py-1 rounded-full">
                    {data.news.filter((n) => n.isBreaking).length > 0 && "🚨 "}
                    {data.news.length} articles
                  </span>
                </div>
                <Link
                  href="/news"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium"
                >
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.news.map((article) => (
                  <NewsTile key={article._id} article={article} />
                ))}
              </div>
            </section>
          )}

          {/* Latest Galleries */}
          {data.galleries.length > 0 && (
            <section data-section="galleries">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🖼️</div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Latest Galleries
                  </h2>
                  <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-sm px-2 py-1 rounded-full">
                    {data.galleries.reduce((total, gallery) => total + gallery.photoCount, 0)} photos
                  </span>
                </div>
                <Link
                  href="/galleries"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium"
                >
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.galleries.map((gallery) => (
                  <GalleryTile key={gallery._id} gallery={gallery} showPreview={true} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Empty State */}
        {data.videos.length === 0 && data.galleries.length === 0 && data.news.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No content yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Check back later for new content!
            </p>
          </div>
        )}

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-center text-white mt-16">
          <h3 className="text-2xl font-bold mb-4">Discover More Amazing Content</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Explore our complete collection of videos, photos, galleries, and news featuring your
            favorite Japanese idols.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/videos"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Browse Videos
            </Link>
            <Link
              href="/galleries"
              className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-medium hover:bg-white/30 transition-colors"
            >
              View Galleries
            </Link>
            <Link
              href="/news"
              className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-medium hover:bg-white/30 transition-colors"
            >
              Read News
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
