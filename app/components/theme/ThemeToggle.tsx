"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import { Sun, Moon, Monitor } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const handleClick = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  return (
    <button
      onClick={handleClick}
      className="p-2 rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle theme"
      title={`Current theme: ${theme}`}
    >
      {/* Show icon based on CURRENT theme */}
      {theme === "light" && <Sun className="w-5 h-5 text-orange-500" />}
      {theme === "dark" && <Moon className="w-5 h-5 text-blue-400" />}
      {theme === "system" && (
        <Monitor className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      )}
    </button>
  );
}
