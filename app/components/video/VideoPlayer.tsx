"use client";

import { useRef, useEffect, useState } from "react";
import { useTheaterMode } from "@/components/video/TheaterModeContext";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title: string;
}

export default function VideoPlayer({
  src,
  poster,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isTheaterMode, toggleTheaterMode } = useTheaterMode();
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      if (!hasStarted) {
        setHasStarted(true);
      }
    };

    video.addEventListener("play", handlePlay);
    return () => video.removeEventListener("play", handlePlay);
  }, [hasStarted]);

  return (
    <div className="relative group">
      <div className={`relative bg-black rounded-lg overflow-hidden transition-all duration-300 ${isTheaterMode ? "aspect-[21/9]" : "aspect-video"}`}>
        <video
          ref={videoRef}
          className="w-full h-full"
          controls
          poster={poster}
          preload="metadata"
        >
          <source src={src} type="video/mp4" />
          <source src={src} type="video/webm" />
          <source src={src} type="video/ogg" />
          Your browser does not support the video tag.
        </video>

        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={toggleTheaterMode}
            className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg transition-colors duration-200"
            title={
              isTheaterMode ? "Exit theater mode (t)" : "Theater mode (t)"
            }
          >
            {isTheaterMode ? (
              // Exit theater mode icon
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 7H5c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 8H5V9h14v6z" />
                <path d="M7 10h2v4H7zm8 0h2v4h-2z" />
              </svg>
            ) : (
              // Theater mode icon
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H5V8h14v8z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
