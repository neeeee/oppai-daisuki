import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../lib/mongodb";
import Photo from "../../../models/Photo";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
        { status: 404 }
      );
    }

    // Check if photo is public (unless admin access)
    if (!photo.isPublic) {
      return NextResponse.json(
        { success: false, error: "Photo not available" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: photo,
    });
  } catch (error: unknown) {
    console.error("Error fetching photo:", error as Error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch photo" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;
    const body = await request.json();

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid photo ID" },
        { status: 400 }
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
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedPhoto,
    });
  } catch (error: unknown) {
    const err = error as any;
    console.error("Error updating photo:", err);

    if (err?.name === "ValidationError") {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: err.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update photo" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const { id } = params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid photo ID" },
        { status: 400 }
      );
    }

    // Find photo before deletion to update counters
    const photo = await Photo.findById(id);

    if (!photo) {
      return NextResponse.json(
        { success: false, error: "Photo not found" },
        { status: 404 }
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
    console.error("Error deleting photo:", error as Error);
    return NextResponse.json(
      { success: false, error: "Failed to delete photo" },
      { status: 500 }
    );
  }
}
