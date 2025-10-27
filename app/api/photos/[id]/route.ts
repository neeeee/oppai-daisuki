import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Photo from "@/models/Photo";
import { auth } from "@/lib/auth";
import logger from "@/lib/utils/logger";
import mongoose from "mongoose";

interface AuthenticatedUser {
  role?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();

    const { id } = await params;

    // Check if id is a valid ObjectId, if not treat as slug
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { slug: id };

    // Find photo by ID or slug and populate related data
    const photo = await Photo.findOne({ ...query, isPublic: true })
      .populate("gallery", "title slug")
      .populate("idol", "name stageName slug profileImage")
      .lean();

    if (!photo) {
      return NextResponse.json(
        { success: false, error: "Photo not found" },
        { status: 404 },
      );
    }

    // Check if photo is public (unless admin access)
    if (!(photo as unknown as { isPublic: boolean }).isPublic) {
      return NextResponse.json(
        { success: false, error: "Photo not available" },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      data: photo,
    });
  } catch (error: unknown) {
    logger.error("Error fetching photo:", error as Error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch photo" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();

    // Admin guard
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    // Origin check
    const origin = request.headers.get("origin");
    const baseUrl = process.env.NEXTAUTH_URL || new URL(request.url).origin;
    if (origin && !origin.startsWith(baseUrl)) {
      return NextResponse.json(
        { success: false, error: "Bad origin" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid photo ID" },
        { status: 400 },
      );
    }

    // Update photo
    const updatedPhoto = await Photo.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    })
      .populate("gallery", "title slug")
      .populate("idol", "name stageName slug profileImage");

    if (!updatedPhoto) {
      return NextResponse.json(
        { success: false, error: "Photo not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedPhoto,
    });
  } catch (error: unknown) {
    const err = error as { name?: string; errors?: unknown };
    logger.error("Error updating photo:", err);

    if (err?.name === "ValidationError") {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: err.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update photo" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();

    // Admin guard
    const session = await auth();
    if (!session || (session.user as AuthenticatedUser)?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    // Origin check
    const origin = request.headers.get("origin");
    const baseUrl = process.env.NEXTAUTH_URL || new URL(request.url).origin;
    if (origin && !origin.startsWith(baseUrl)) {
      return NextResponse.json(
        { success: false, error: "Bad origin" },
        { status: 403 },
      );
    }

    const { id } = await params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid photo ID" },
        { status: 400 },
      );
    }

    // Find photo before deletion to update counters
    const photo = await Photo.findById(id);

    if (!photo) {
      return NextResponse.json(
        { success: false, error: "Photo not found" },
        { status: 404 },
      );
    }

    // Delete photo
    await Photo.findByIdAndDelete(id);

    // Update gallery and idol counters if needed
    if (photo.gallery) {
      const Gallery = mongoose.model("Gallery");
      await Gallery.findByIdAndUpdate(photo.gallery, {
        $inc: { photoCount: -1 },
      });
    }

    if (photo.idol) {
      const Idol = mongoose.model("Idol");
      await Idol.findByIdAndUpdate(photo.idol, { $inc: { photoCount: -1 } });
    }

    return NextResponse.json({
      success: true,
      message: "Photo deleted successfully",
    });
  } catch (error: unknown) {
    logger.error("Error deleting photo:", error as Error);
    return NextResponse.json(
      { success: false, error: "Failed to delete photo" },
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
        { success: false, message: "Photo ID is required" },
        { status: 400 },
      );
    }

    // Check if id is a valid ObjectId, if not treat as slug
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { slug: id };

    const photo = await Photo.findOne(query);
    if (!photo) {
      return NextResponse.json(
        { success: false, message: "Photo not found" },
        { status: 404 },
      );
    }

    switch (action) {
      case "like":
        // Increment like count
        await Photo.findOneAndUpdate(query, {
          $inc: { likeCount: 1 },
        });
        return NextResponse.json({
          success: true,
          message: "Like count incremented",
        });

      case "download":
        // Increment download count
        await Photo.findOneAndUpdate(query, {
          $inc: { downloadCount: 1 },
        });
        return NextResponse.json({
          success: true,
          message: "Download count incremented",
        });

      case "share":
        // For future implementation - could track share count
        return NextResponse.json({
          success: true,
          message: "Photo shared successfully",
        });

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 },
        );
    }
  } catch (error) {
    logger.error("Error updating photo:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update photo" },
      { status: 500 },
    );
  }
}
