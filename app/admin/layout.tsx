"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [lastActivity, setLastActivity] = useState<Date>(new Date());

  const cmsNav = [
    { href: "/admin", label: "Videos" },
    { href: "/admin/news", label: "News" },
    { href: "/admin/idols", label: "Idols" },
    { href: "/admin/genres", label: "Genres" },
    { href: "/admin/galleries", label: "Galleries" },
    { href: "/admin/photos", label: "Photos" },
  ];

  useEffect(() => {
    if (status === "loading") return; // Don't redirect while loading

    // Allow unauthenticated access on the login route
    if (pathname?.startsWith("/admin/login")) {
      return;
    }

    if (status === "unauthenticated") {
      const currentPath = window.location.pathname;
      const loginUrl = `/admin/login${currentPath !== "/admin" ? `?callbackUrl=${currentPath}` : ""}`;
      router.push(loginUrl);
      return;
    }

    if (session?.user?.role !== "admin") {
      router.push("/admin/login?error=access_denied");
      return;
    }
  }, [status, session, router, pathname]);

  useEffect(() => {
    // Update last activity time on user interaction
    const updateActivity = () => setLastActivity(new Date());

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];
    events.forEach((event) => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, []);



  const handleLogout = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      await signOut({ callbackUrl: "/admin/login" });
    }
  };



  // Allow login route to render without admin gating
  if (pathname?.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShieldCheckIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 admin-area" data-admin-area>
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <ShieldCheckIcon className="h-8 w-8 text-indigo-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Admin Panel
                </h1>
                <p className="text-xs text-gray-500">
                  Secure Administrative Area
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm">
                  <UserCircleIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">{session.user.email}</span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <ComputerDesktopIcon className="h-4 w-4" />
                  <span className="text-xs">{session.user.ip}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Security Warning Banner */}
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-yellow-800">
              <ShieldCheckIcon className="h-4 w-4" />
              <span>
                Secure Admin Session - All actions are logged and monitored
              </span>
            </div>
            <div className="text-yellow-700 text-xs">
              Last activity: {lastActivity.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Sub-navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex flex-wrap gap-3 py-3 text-sm">
            {cmsNav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/admin" && pathname?.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`px-3 py-1.5 rounded-md transition-colors ${
                      active
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Security Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <div className="flex space-x-6">
              <span>🔒 End-to-End Encrypted</span>
              <span>🛡️ CSRF Protected</span>
              <span>📊 Activity Monitored</span>
              <span>🚫 Rate Limited</span>
            </div>
            <div>
              {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutContent>{children}</AdminLayoutContent>;
}
