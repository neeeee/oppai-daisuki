import React from "react";
import { VideoPage } from "../../components/video/VideoPage";

async function getVideo(id: string) {
  const res = await fetch(`http://localhost:3000/api/videos/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Video not found");
  }
  return res.json();
}

export default async function WatchPage({
  params,
}: {
  params: { id: string };
}) {
  const video = await getVideo(params.id);

  return (
    <VideoPage
      videoSrc={video.url}
      title={video.title}
      channelName={video.channelName}
      channelAvatarUrl={video.channelAvatarUrl}
      views={video.views}
      uploadedTime={video.uploadedTime}
    />
  );
}
