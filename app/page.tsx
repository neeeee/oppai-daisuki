"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import VideoTile from "@/components/tiles/VideoTile";
import PhotoTile from "@/components/tiles/PhotoTile";
import GalleryTile from "@/components/tiles/GalleryTile";
import NewsTile from "@/components/tiles/NewsTile";


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

interface Photo {
  _id: string;
  title?: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  altText?: string;
  photographer?: string;
  location?: string;
  tags?: string[];
  dimensions?: {
    width: number;
    height: number;
  };
  fileSize?: number;
  captureDate?: string;
  uploadDate: string;
  viewCount: number;
  likeCount: number;
  downloadCount: number;
  isPublic: boolean;
  isAdult: boolean;
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
  gallery?: {
    _id: string;
    title: string;
  };
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
  photos: Photo[];
  galleries: Gallery[];
  news: NewsArticle[];
  stats: {
    totalVideos: number;
    totalPhotos: number;
    totalGalleries: number;
    totalNews: number;
  };
}

export default function HomePage() {
  const [data, setData] = useState<HomePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'all' | 'videos' | 'photos' | 'galleries' | 'news'>('all');

  useEffect(() => {
    fetchHomePageData();
  }, []);

  const fetchHomePageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch recent content from all categories
      const [videosRes, photosRes, galleriesRes, newsRes] = await Promise.all([
        fetch('/api/videos?limit=6&sortBy=createdAt&sortOrder=desc'),
        fetch('/api/photos?limit=6&sortBy=createdAt&sortOrder=desc'),
        fetch('/api/galleries?limit=6&sortBy=createdAt&sortOrder=desc'),
        fetch('/api/news?limit=6&sortBy=publishedAt&sortOrder=desc&status=published')
      ]);

      const [videosData, photosData, galleriesData, newsData] = await Promise.all([
        videosRes.json(),
        photosRes.json(),
        galleriesRes.json(),
        newsRes.json()
      ]);

      setData({
        videos: videosData.success ? videosData.data : [],
        photos: photosData.success ? photosData.data : [],
        galleries: galleriesData.success ? galleriesData.data : [],
        news: newsData.success ? newsData.data : [],
        stats: {
          totalVideos: videosData.pagination?.totalItems || 0,
          totalPhotos: photosData.pagination?.totalItems || 0,
          totalGalleries: galleriesData.pagination?.totalItems || 0,
          totalNews: newsData.pagination?.totalItems || 0,
        }
      });
    } catch (err) {
      setError('Failed to load content');
      (() => { import("@/lib/utils/logger").then(m => m.default.error('Error fetching homepage data:', err)); })();
    } finally {
      setLoading(false);
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section Skeleton */}
          <div className="text-center mb-12 animate-pulse">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto mb-4"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto mb-8"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="space-y-12">
            {[...Array(4)].map((_, section) => (
              <div key={section}>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Oops! Something went wrong
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {error || "We couldn't load the homepage content."}
          </p>
          <button
            onClick={fetchHomePageData}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCount(data.stats.totalVideos)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Videos</div>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCount(data.stats.totalPhotos)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Photos</div>
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

          {/* Section Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {[
              { key: 'all', label: 'All Content', icon: '🌟' },
              { key: 'videos', label: 'Videos', icon: '📹' },
              { key: 'photos', label: 'Photos', icon: '📷' },
              { key: 'galleries', label: 'Galleries', icon: '🖼️' },
              { key: 'news', label: 'News', icon: '📰' }
            ].map((section) => (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key as typeof activeSection)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeSection === section.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700'
                }`}
              >
                <span>{section.icon}</span>
                <span className="hidden sm:inline">{section.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-12">
          {/* Latest Videos */}
          {(activeSection === 'all' || activeSection === 'videos') && data.videos.length > 0 && (
            <section>
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
          {(activeSection === 'all' || activeSection === 'news') && data.news.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📰</div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Latest News
                  </h2>
                  <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-sm px-2 py-1 rounded-full">
                    {data.news.filter(n => n.isBreaking).length > 0 && '🚨 '}
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
          {(activeSection === 'all' || activeSection === 'galleries') && data.galleries.length > 0 && (
            <section>
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
                  <GalleryTile key={gallery._id} gallery={gallery} />
                ))}
              </div>
            </section>
          )}

          {/* Latest Photos */}
          {(activeSection === 'all' || activeSection === 'photos') && data.photos.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📷</div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Latest Photos
                  </h2>
                  <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-sm px-2 py-1 rounded-full">
                    {data.photos.filter(p => p.metadata.featured).length > 0 && '⭐ '}
                    {data.photos.length} new
                  </span>
                </div>
                <Link
                  href="/photos"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium"
                >
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.photos.map((photo) => (
                  <PhotoTile key={photo._id} photo={photo} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Empty State */}
        {((activeSection === 'videos' && data.videos.length === 0) ||
          (activeSection === 'photos' && data.photos.length === 0) ||
          (activeSection === 'galleries' && data.galleries.length === 0) ||
          (activeSection === 'news' && data.news.length === 0)) && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">
              {activeSection === 'videos' && '📹'}
              {activeSection === 'photos' && '📷'}
              {activeSection === 'galleries' && '🖼️'}
              {activeSection === 'news' && '📰'}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No {activeSection} yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Check back later for new content!
            </p>
          </div>
        )}

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-center text-white mt-16">
          <h3 className="text-2xl font-bold mb-4">
            Discover More Amazing Content
          </h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Explore our complete collection of videos, photos, galleries, and news featuring your favorite Japanese idols.
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
