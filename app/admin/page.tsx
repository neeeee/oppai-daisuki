"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
    }
  }, [status, router]);

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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back! Manage your content from here.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Videos</p>
                <p className="text-2xl font-bold text-gray-900">—</p>
              </div>
              <div className="text-3xl">📺</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Photos</p>
                <p className="text-2xl font-bold text-gray-900">—</p>
              </div>
              <div className="text-3xl">📸</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Galleries</p>
                <p className="text-2xl font-bold text-gray-900">—</p>
              </div>
              <div className="text-3xl">🖼️</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Idols</p>
                <p className="text-2xl font-bold text-gray-900">—</p>
              </div>
              <div className="text-3xl">👤</div>
            </div>
          </div>
        </div>

        {/* Admin Sections Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Content Management
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminSections.map((section) => (
              <Link
                key={section.name}
                href={section.href}
                className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`${section.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}
                    >
                      {section.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {section.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">{section.description}</p>
                  <div className="mt-4 flex items-center text-indigo-600 text-sm font-medium">
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
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="text-sm text-gray-500">
            Activity tracking coming soon...
          </div>
        </div>
      </div>
    </div>
  );
}
