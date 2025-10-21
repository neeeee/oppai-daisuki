import dbConnect from "../../lib/mongodb";
import Video from "../../models/Video";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("Attempting to connect to MongoDB...");
    await dbConnect();
    console.log("Connected to MongoDB, fetching videos...");
    const videos = await Video.find({}).sort({ createdAt: -1 });
    console.log(`Found ${videos.length} videos`);
    return NextResponse.json({ success: true, data: videos });
  } catch (error) {
    console.error("Error in GET /api/videos:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 400 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("POST request received");
    const body = await request.json();
    console.log("Request body:", body);

    console.log("Attempting to connect to MongoDB...");
    await dbConnect();
    console.log("Connected to MongoDB, creating video...");

    const video = await Video.create(body);
    console.log("Video created successfully:", video._id);

    return NextResponse.json({ success: true, data: video }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/videos:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 400 },
    );
  }
}
