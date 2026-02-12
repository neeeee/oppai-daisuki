"use client";

import { useState, useEffect } from "react";

type Section = "all" | "videos" | "galleries" | "news";

const sections = [
  { key: "all" as const, label: "All Content", icon: "🌟" },
  { key: "videos" as const, label: "Videos", icon: "📹" },
  { key: "galleries" as const, label: "Galleries", icon: "🖼️" },
  { key: "news" as const, label: "News", icon: "📰" },
];

export default function HomeContentFilter() {
  const [activeSection, setActiveSection] = useState<Section>("all");

  useEffect(() => {
    // Show/hide sections based on selection using data attributes
    const allSections = document.querySelectorAll("[data-section]");
    allSections.forEach((section) => {
      const sectionType = section.getAttribute("data-section");
      if (activeSection === "all" || sectionType === activeSection) {
        (section as HTMLElement).style.display = "";
      } else {
        (section as HTMLElement).style.display = "none";
      }
    });
  }, [activeSection]);

  return (
    <div className="flex flex-wrap justify-center gap-2 mb-8">
      {sections.map((section) => (
        <button
          key={section.key}
          onClick={() => setActiveSection(section.key)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeSection === section.key
              ? "bg-blue-600 text-white"
              : "bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700"
          }`}
        >
          <span>{section.icon}</span>
          <span className="hidden sm:inline">{section.label}</span>
        </button>
      ))}
    </div>
  );
}
