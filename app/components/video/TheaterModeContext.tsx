"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface TheaterModeContextType {
  isTheaterMode: boolean;
  toggleTheaterMode: () => void;
}

const TheaterModeContext = createContext<TheaterModeContextType | undefined>(
  undefined,
);

export function TheaterModeProvider({ children }: { children: ReactNode }) {
  const [isTheaterMode, setIsTheaterMode] = useState(false);

  const toggleTheaterMode = () => {
    setIsTheaterMode((prev) => !prev);
  };

  return (
    <TheaterModeContext.Provider value={{ isTheaterMode, toggleTheaterMode }}>
      {children}
    </TheaterModeContext.Provider>
  );
}

export function useTheaterMode() {
  const context = useContext(TheaterModeContext);
  if (context === undefined) {
    throw new Error("useTheaterMode must be used within a TheaterModeProvider");
  }
  return context;
}