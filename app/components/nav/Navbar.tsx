"use client";

import Link from "next/link";
import NavItem from "./NavItem";
import ThemeToggle  from "../theme/ThemeToggle";

const pages = [
  { title: "Videos", href: "/videos" },
  { title: "Galleries", href: "/galleries" },
  { title: "Idols", href: "/idols" },
  { title: "Genres", href: "/genres" },
  { title: "News", href: "/news" },
];

const Navbar: React.FC = () => {
  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 w-full">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="text-xl font-semibold text-gray-900 dark:text-white">
              <Link href="/" className="hover:text-blue-500">
                0π-dsk
              </Link>
            </div>
            <div className="hidden md:flex space-x-8">
              {pages.map((page) => (
                <NavItem key={page.title} title={page.title} href={page.href} />
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden pb-4">
          <div className="flex flex-wrap gap-4">
            {pages.map((page) => (
              <NavItem key={page.title} title={page.title} href={page.href} />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
