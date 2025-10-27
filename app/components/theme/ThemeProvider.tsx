"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: "dark" | "light";
};

const ThemeProviderContext = createContext<
  ThemeProviderContextType | undefined
>(undefined);

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [actualTheme, setActualTheme] = useState<"dark" | "light">("light");
  const [mounted, setMounted] = useState(false);

  // Get system theme
  const getSystemTheme = useCallback((): "dark" | "light" => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }, []);

  // Apply theme to DOM
  const applyTheme = useCallback((resolvedTheme: "dark" | "light") => {
    const root = document.documentElement;

    // Remove all theme classes
    root.classList.remove("light", "dark");

    // Add new theme class
    root.classList.add(resolvedTheme);
  }, []);

  // Initialize theme from localStorage or default
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem(storageKey) as Theme | null;
    const initialTheme = stored || defaultTheme;

    setTheme(initialTheme);
    setMounted(true);
  }, [defaultTheme, storageKey]);

  // Update theme when theme state changes
  useEffect(() => {
    if (!mounted) return;

    const resolvedTheme = theme === "system" ? getSystemTheme() : theme;
    setActualTheme(resolvedTheme);
    applyTheme(resolvedTheme);

    // Save to localStorage
    try {
      localStorage.setItem(storageKey, theme);
    } catch {
      // Silently fail localStorage saves
    }
  }, [theme, mounted, getSystemTheme, applyTheme, storageKey]);

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted || theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      const newSystemTheme = getSystemTheme();
      setActualTheme(newSystemTheme);
      applyTheme(newSystemTheme);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted, getSystemTheme, applyTheme]);

  const handleThemeChange = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
  }, []);

  const value = {
    theme,
    setTheme: handleThemeChange,
    actualTheme,
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}
