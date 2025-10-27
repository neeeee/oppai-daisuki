// components/ThemeToggle.tsx
"use client";

import { useTheme } from "@/components/theme/ThemeProvider";

export default function ThemeToggle() {
  const { theme, setTheme, actualTheme } = useTheme();

  const nextTheme =
    theme === "light" ? "dark" : theme === "dark" ? "system" : "light";

  return (
    <button
      onClick={() => setTheme(nextTheme)}
      className="p-2 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-800"
    >
      Theme: {actualTheme}
    </button>
  );
}
