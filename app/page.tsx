import React from "react";
import { VideoTile } from "./components/video/VideoCard";

// async function getVideos() {
//   const res = await fetch("http://localhost:3000/api/videos", {
//     cache: "no-store",
//   });
//   return res.json();
// }

export default async function HomePage() {
  // const videos = await getVideos();

  return (
    <main className="min-h-screen w-full bg-neutral-100 dark:bg-neutral-800 p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {/*{videos.map((video: any) => (
          <VideoTile
            key={video.id}
            id={video.id}
            thumbnailUrl={video.thumbnailUrl}
            title={video.title}
            channelName={video.channelName}
            channelAvatarUrl={video.channelAvatarUrl}
            views={video.views}
            uploadedTime={video.uploadedTime}
            duration={`${Math.floor(video.duration / 60)}:${(
              video.duration % 60
            )
              .toString()
              .padStart(2, "0")}`}
          />
        ))}*/}
      </div>
    </main>
  );
}
