import dbConnect from "@/lib/mongodb";
import Video from "@/models/Video";
import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/utils/logger";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const skip = (page - 1) * limit;

    // Get videos in chronological order (newest first)
    const videos = await Video.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Video.countDocuments();
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        videos,
        pagination: {
          currentPage: page,
          totalPages,
          totalVideos: total,
          hasNextPage,
          hasPrevPage,
          limit,
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching paginated videos:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 400 },
    );
  }
}
