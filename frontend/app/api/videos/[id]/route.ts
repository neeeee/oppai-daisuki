import { NextRequest, NextResponse } from "next/server";

//get all videos from db
// videos = db.getVideos() <- doesn't exist yet
// additional logic here for pagination, safety checks, etc
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  const video = videos.find((v) => v.id === id);

  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  return NextResponse.json(video, { status: 200 });
}
