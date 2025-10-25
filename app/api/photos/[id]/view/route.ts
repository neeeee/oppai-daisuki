import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../../lib/mongodb";
import Photo from "../../../../models/Photo";
import logger from "@/lib/utils/logger";
import mongoose from "mongoose";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();

    const { id } = await params;

    // Check if id is a valid ObjectId, if not treat as slug
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { slug: id };

    // Find photo and increment view count
    const photo = await Photo.findOneAndUpdate(
      query,
      { $inc: { viewCount: 1 } },
      { new: true },
    );

    if (!photo) {
      return NextResponse.json(
        { success: false, error: "Photo not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      viewCount: photo.viewCount,
    });
  } catch (error: unknown) {
    logger.error("Error incrementing view count:", error);
    return NextResponse.json(
      { success: false, error: "Failed to increment view count" },
      { status: 500 },
    );
  }
}
