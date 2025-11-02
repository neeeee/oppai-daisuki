import { NextRequest, NextResponse } from "next/server";
import Gallery from "@/models/Gallery";
import Photo from "@/models/Photo";
import dbConnect from "@/lib/mongodb";
import logger from "@/lib/utils/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Gallery ID is required" },
        { status: 400 },
      );
    }

    // Find the gallery by ObjectId or slug
    let gallery;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // It's a valid ObjectId
      gallery = await Gallery.findById(id)
        .populate("idol", "name stageName avatar")
        .populate("genres", "name slug color")
        .populate({
          path: "photos",
          select: "imageUrl thumbnailUrl uploadThingKey"
        })
        .lean();
    } else {
      // It's a slug
      gallery = await Gallery.findOne({ slug: id })
        .populate("idol", "name stageName avatar")
        .populate("genres", "name slug color")
        .populate({
          path: "photos",
          select: "imageUrl thumbnailUrl uploadThingKey"
        })
        .lean();
    }

    if (!gallery) {
      return NextResponse.json(
        { success: false, message: "Gallery not found" },
        { status: 404 },
      );
    }

    // Get all photos in this gallery using the gallery's ObjectId
    const photos = await Photo.find({
      gallery: (gallery as { _id: unknown })._id,
      isPublic: true,
    })
      .select("_id title imageUrl thumbnailUrl altText dimensions fileSize")
      .sort({ createdAt: 1 })
      .lean();

    // Update photo count if it doesn't match
    if ((gallery as { photoCount?: number }).photoCount !== photos.length) {
      await Gallery.findByIdAndUpdate((gallery as { _id: unknown })._id, {
        photoCount: photos.length,
      });
      // Note: photoCount will be updated in the database, local object not modified
    }

    return NextResponse.json({
      success: true,
      data: {
        ...gallery,
        photos,
      },
    });
  } catch (error) {
    logger.error("Error fetching gallery:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch gallery" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Gallery ID is required" },
        { status: 400 },
      );
    }

    let gallery;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      gallery = await Gallery.findById(id);
    } else {
      gallery = await Gallery.findOne({ slug: id });
    }
    if (!gallery) {
      return NextResponse.json(
        { success: false, message: "Gallery not found" },
        { status: 404 },
      );
    }
  } catch (error) {
    logger.error("Error deleting gallery:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update gallery" },
      { status: 500 },
    );
  }
}
