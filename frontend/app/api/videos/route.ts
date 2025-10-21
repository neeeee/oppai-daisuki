// app/api/videos/route.ts
import { NextResponse } from "next/server";

const videos = [
  {
    id: "1",
    title: "Intro to TypeScript",
    channelName: "Daisuki",
    thumbnailUrl: "/thumb.avif",
    channelAvatarUrl: "/prof.jpg",
    url: "https://www.youtube.com/watch?v=1234567890",
    views: 1000,
    duration: 300,
  },
  {
    id: "2",
    title: "Advanced Node.js",
    channelName: "Daisuki",
    thumbnailUrl: "/thumb.avif",
    channelAvatarUrl: "/prof.jpg",
    url: "https://www.youtube.com/watch?v=1234567890",
    views: 500,
    duration: 720,
  },
  {
    id: "3",
    title: "Next.js Tutorial",
    channelName: "Daisuki",
    thumbnailUrl: "/thumb.avif",
    channelAvatarUrl: "/prof.jpg",
    url: "https://www.youtube.com/watch?v=1234567890",
    views: 2000,
    duration: 540,
  },
  {
    id: "4",
    title: "Next.js Tutorial",
    channelName: "Daisuki",
    thumbnailUrl: "/thumb.avif",
    channelAvatarUrl: "/prof.jpg",
    url: "https://www.youtube.com/watch?v=1234567890",
    views: 2000,
    duration: 540,
  },
];

export async function GET() {
  return NextResponse.json(videos);
}
