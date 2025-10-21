"use client";

import { useRef, useEffect, useState } from "react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title: string;
  onViewIncrement?: () => void;
}

export default function VideoPlayer({
  src,
  poster,
  title,
  onViewIncrement,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      if (!hasStarted) {
        setHasStarted(true);
        onViewIncrement?.();
      }
    };

    video.addEventListener("play", handlePlay);
    return () => video.removeEventListener("play", handlePlay);
  }, [hasStarted, onViewIncrement]);

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-auto"
        controls
        poster={poster}
        preload="metadata"
        style={{ maxHeight: "70vh" }}
      >
        <source src={src} type="video/mp4" />
        <source src={src} type="video/webm" />
        <source src={src} type="video/ogg" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
