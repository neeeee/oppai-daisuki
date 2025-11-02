import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Photo from "@/models/Photo";
import Gallery from "@/models/Gallery";
import Idol from "@/models/Idol";
import logger from "@/lib/utils/logger";
import { auth } from "@/lib/auth";
import { isOriginAllowed } from "@/lib/utils/origin-validation";
import { deleteUploadThingFiles } from "@/lib/utils/uploadthing/deleteFiles";
import { AdminUser } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const category = searchParams.get("category");
    const gallery = searchParams.get("gallery");
    const idol = searchParams.get("idol");
    const tags = searchParams.get("tags");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "uploadDate";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const isAdult = searchParams.get("isAdult");
    const includeStats = searchParams.get("includeStats") === "true";

    // Build query
    const query: Record<string, unknown> = { isPublic: true };

    if (category) {
      query.category = category;
    }

    if (gallery) {
      query.gallery = gallery;
    }

    if (idol) {
      query.idol = idol;
    }

    if (tags) {
      const tagArray = tags.split(",").map((tag) => tag.trim());
      query.tags = { $in: tagArray };
    }

    if (tag) {
      query.tags = { $in: [tag.trim()] };
    }

    if (isAdult === "false") {
      query.isAdult = false;
    } else if (isAdult === "true") {
      query.isAdult = true;
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query with population
    const [photos, total] = await Promise.all([
      Photo.find(query)
        .populate("gallery", "title slug")
        .populate("idol", "name stageName slug profileImage")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Photo.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Include additional stats if requested
    let stats = null;
    if (includeStats) {
      const [totalPhotos, featuredCount, trendingCount] = await Promise.all([
        Photo.countDocuments({ isPublic: true }),
        Photo.countDocuments({ isPublic: true, "metadata.featured": true }),
        Photo.countDocuments({ isPublic: true, "metadata.trending": true }),
      ]);

      stats = {
        totalPhotos,
        featuredCount,
        trendingCount,
      };
    }

    return NextResponse.json({
      success: true,
      data: photos,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      stats,
    });
  } catch (error: unknown) {
    void error;
    return NextResponse.json(
      { success: false, error: "Failed to fetch photos" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const session = await auth();
    if (!session || (session.user as AdminUser)?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const origin = request.headers.get("origin");
    const originAllowed = isOriginAllowed(origin, request.url);
    if (!originAllowed) {
      console.log(`[API] Rejecting request due to origin validation`);
      return NextResponse.json(
        { success: false, error: "Bad origin" },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Validate required fields
    const { title, imageUrl, thumbnailUrl } = body;
    if (!title || !imageUrl || !thumbnailUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: title, imageUrl, thumbnailUrl",
        },
        { status: 400 },
      );
    }

    // Create photo
    const photo = await Photo.create(body);

    // Update related gallery photo count if gallery is specified
    if (photo.gallery) {
      await Gallery.findByIdAndUpdate(photo.gallery, {
        $inc: { photoCount: 1 },
      });
    }

    // Update related idol photo count if idol is specified
    if (photo.idol) {
      await Idol.findByIdAndUpdate(photo.idol, { $inc: { photoCount: 1 } });
    }

    // Populate the created photo
    const populatedPhoto = await Photo.findById(photo._id)
      .populate("gallery", "title slug")
      .populate("idol", "name stageName slug profileImage");

    return NextResponse.json(
      {
        success: true,
        data: populatedPhoto,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    void error;

    const err = error as { name?: string; errors?: unknown };
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
      { success: false, error: "Failed to create photo" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const origin = request.headers.get("origin");
    if (!isOriginAllowed(origin, request.url)) {
      return NextResponse.json({ success: false, error: "Bad origin" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const ids = searchParams.get("ids");
    if (!ids) return NextResponse.json({ success: false, error: "Photo IDs required" }, { status: 400 });

    const photoIds = ids.split(",").map((id) => id.trim());
    const photos = await Photo.find({ _id: { $in: photoIds } }).select("uploadThingKey imageUrl");

    const keys = photos.map((p) => p.uploadThingKey).filter(Boolean);
    if (keys.length) await deleteUploadThingFiles(keys);

    await Photo.deleteMany({ _id: { $in: photoIds } });

    return NextResponse.json({ success: true, deletedCount: photoIds.length });
  } catch (error) {
    logger.error("Error deleting photos:", error);
    return NextResponse.json({ success: false, error: "Deletion failed" }, { status: 500 });
  }
}
