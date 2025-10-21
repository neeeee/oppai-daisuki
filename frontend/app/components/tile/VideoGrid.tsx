import React from "react";
import { VideoTile } from "./VideoTile";

export const VideoGrid = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-4">
      <VideoTile
        thumbnailUrl="/thumb.avif"
        title="How to Start Diggin in Yo Butt"
        channelName="Twin"
        channelAvatarUrl="/prof.jpg"
        views={254000}
        uploadedTime="2 days ago"
      />
      <VideoTile
        thumbnailUrl="/thumb.avif"
        title="How to Start Diggin in Yo Butt"
        channelName="Twin"
        channelAvatarUrl="/prof.jpg"
        views={254000}
        uploadedTime="2 days ago"
      />
      <VideoTile
        thumbnailUrl="/thumb.avif"
        title="How to Start Diggin in Yo Butt"
        channelName="Twin"
        channelAvatarUrl="/prof.jpg"
        views={254000}
        uploadedTime="2 days ago"
      />
      <VideoTile
        thumbnailUrl="/thumb.avif"
        title="How to Start Diggin in Yo Butt"
        channelName="Twin"
        channelAvatarUrl="/prof.jpg"
        views={254000}
        uploadedTime="2 days ago"
      />
    </div>
  );
};
