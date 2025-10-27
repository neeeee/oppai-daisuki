"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import logger from "@/lib/utils/logger";

export default function AdminDashboard() {
  const { status } = useSession();
  const router = useRouter();

  const [counts, setCounts] = useState<{
    videos: number | null;
    photos: number | null;
    galleries: number | null;
    idols: number | null;
    loading: boolean;
  }>({
    videos: null,
    photos: null,
    galleries: null,
    idols: null,
    loading: true,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCounts();
    }
  }, [status]);

  const fetchCounts = async () => {
    try {
      const [videosRes, photosRes, galleriesRes, idolsRes] = await Promise.all([
        fetch("/api/videos?limit=1").then((res) => res.json()),
        fetch("/api/photos?limit=1").then((res) => res.json()),
        fetch("/api/galleries?limit=1").then((res) => res.json()),
        fetch("/api/idols?limit=1").then((res) => res.json()),
      ]);

      setCounts({
        videos: videosRes.success ? videosRes.pagination?.totalItems || 0 : 0,
        photos: photosRes.success ? photosRes.pagination?.totalItems || 0 : 0,
        galleries: galleriesRes.success
          ? galleriesRes.pagination?.totalItems || 0
          : 0,
        idols: idolsRes.success ? idolsRes.pagination?.totalItems || 0 : 0,
        loading: false,
      });
    } catch (error) {
      logger.error("Error fetching counts:", error);
      setCounts({
        videos: 0,
        photos: 0,
        galleries: 0,
        idols: 0,
        loading: false,
      });
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const adminSections = [
    {
      name: "Videos",
      description: "Manage idol videos with genre and idol associations",
      icon: "📺",
      href: "/admin/videos",
      color: "bg-red-500",
    },
    {
      name: "Photos",
      description: "Upload and manage photo collections",
      icon: "📸",
      href: "/admin/photos",
      color: "bg-blue-500",
    },
    {
      name: "Galleries",
      description: "Organize photos into galleries",
      icon: "🖼️",
      href: "/admin/galleries",
      color: "bg-purple-500",
    },
    {
      name: "Idols",
      description: "Manage idol profiles and information",
      icon: "👤",
      href: "/admin/idols",
      color: "bg-pink-500",
    },
    {
      name: "Genres",
      description: "Create and manage content genres",
      icon: "📂",
      href: "/admin/genres",
      color: "bg-indigo-500",
    },
    {
      name: "News",
      description: "Publish news articles and updates",
      icon: "📰",
      href: "/admin/news",
      color: "bg-green-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Welcome back! Manage your content from here.
            </p>
          </div>
          <button
            onClick={() => fetchCounts()}
            disabled={counts.loading}
            className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {counts.loading ? "Refreshing..." : "Refresh Stats"}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Videos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {counts.loading ? (
                    <span className="animate-pulse bg-gray-200 rounded w-8 h-8 inline-block"></span>
                  ) : (
                    (counts.videos ?? 0).toLocaleString()
                  )}
                </p>
              </div>
              <div className="text-3xl">📺</div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Photos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {counts.loading ? (
                    <span className="animate-pulse bg-gray-200 rounded w-8 h-8 inline-block"></span>
                  ) : (
                    (counts.photos ?? 0).toLocaleString()
                  )}
                </p>
              </div>
              <div className="text-3xl">📸</div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Galleries
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {counts.loading ? (
                    <span className="animate-pulse bg-gray-200 rounded w-8 h-8 inline-block"></span>
                  ) : (
                    (counts.galleries ?? 0).toLocaleString()
                  )}
                </p>
              </div>
              <div className="text-3xl">🖼️</div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Idols
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {counts.loading ? (
                    <span className="animate-pulse bg-gray-200 rounded w-8 h-8 inline-block"></span>
                  ) : (
                    (counts.idols ?? 0).toLocaleString()
                  )}
                </p>
              </div>
              <div className="text-3xl">👤</div>
            </div>
          </div>
        </div>

        {/* Admin Sections Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Content Management
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminSections.map((section) => (
              <Link
                key={section.name}
                href={section.href}
                className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`${section.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}
                    >
                      {section.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {section.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {section.description}
                  </p>
                  <div className="mt-4 flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium">
                    Manage
                    <svg
                      className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Activity tracking coming soon...
          </div>
        </div>
      </div>
    </div>
  );
}
