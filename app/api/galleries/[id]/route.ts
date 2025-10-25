import { NextRequest, NextResponse } from "next/server";
import Gallery from "../../../models/Gallery";
import Photo from "../../../models/Photo";
import dbConnect from "../../../lib/mongodb";
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
        .populate("genre", "name description")
        .lean();
    } else {
      // It's a slug
      gallery = await Gallery.findOne({ slug: id })
        .populate("idol", "name stageName avatar")
        .populate("genre", "name description")
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
    const { action } = await request.json();

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

    switch (action) {
      case "view":
        // Increment view count
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
          await Gallery.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
        } else {
          await Gallery.findOneAndUpdate(
            { slug: id },
            { $inc: { viewCount: 1 } },
          );
        }
        return NextResponse.json({
          success: true,
          message: "View count incremented",
        });

      case "like":
        // Increment like count
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
          await Gallery.findByIdAndUpdate(id, { $inc: { likeCount: 1 } });
        } else {
          await Gallery.findOneAndUpdate(
            { slug: id },
            { $inc: { likeCount: 1 } },
          );
        }
        return NextResponse.json({
          success: true,
          message: "Like count incremented",
        });

      case "download":
        // Increment download count
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
          await Gallery.findByIdAndUpdate(id, { $inc: { downloadCount: 1 } });
        } else {
          await Gallery.findOneAndUpdate(
            { slug: id },
            { $inc: { downloadCount: 1 } },
          );
        }
        return NextResponse.json({
          success: true,
          message: "Download count incremented",
        });

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 },
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
