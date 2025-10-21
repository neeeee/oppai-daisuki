import React from "react";
import Image from "next/image";
import Navbar from "../nav/Navbar";

interface VideoPageProps {
  videoSrc: string;
  title: string;
  channelName: string;
  channelAvatarUrl: string;
  views: number;
  uploadedTime: string;
}

export const VideoPage: React.FC<VideoPageProps> = ({
  videoSrc,
  title,
  channelName,
  channelAvatarUrl,
  views,
  uploadedTime,
}) => {
  const formattedViews = Intl.NumberFormat("en-US", {
    notation: "compact",
  }).format(views);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-black text-white">
      {/* Navbar placeholder */}
      <Navbar />

      {/* Theater layout */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-2">
        <div className="w-full max-w-6xl aspect-video relative">
          <video
            src={videoSrc}
            controls
            autoPlay
            className="w-full h-full object-contain bg-black rounded-lg"
          />
        </div>

        {/* Metadata */}
        <div className="w-full max-w-6xl mt-4 px-1 flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Image
              width={36}
              height={36}
              src={channelAvatarUrl}
              alt={channelName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h1 className="text-xl font-semibold mb-1">{title}</h1>
              <p className="text-sm text-gray-400">
                {channelName} • {formattedViews} views • {uploadedTime}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
