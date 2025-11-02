import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Video from "@/models/Video";
import Idol from "@/models/Idol";
import Genre from "@/models/Genre";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";
import { isOriginAllowed } from "@/lib/utils/origin-validation";
import { deleteUploadThingFiles } from "@/lib/utils/uploadthing/deleteFiles";
import logger from "@/lib/utils/logger";

interface AuthenticatedUser {
  role?: string;
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    // Check if this is an admin request
    const isAdmin = searchParams.get("admin") === "true";

    // If admin request, verify authentication
    if (isAdmin) {
      const session = await auth();
      if (!session || (session.user as AuthenticatedUser)?.role !== "admin") {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 },
        );
      }
    }

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const idol = searchParams.get("idol");
    const genre = searchParams.get("genre");
    const category = searchParams.get("category");
    const tags = searchParams.get("tags");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const isAdult = searchParams.get("isAdult");

    // Build query
    const query: Record<string, unknown> = {};

    if (!isAdmin) {
      query.isPublic = true;
    }

    if (idol) {
      query.idol = idol;
    }

    if (genre) {
      query.genres = genre;
    }

    if (category) {
      query.category = category;
    }

    if (tags) {
      const tagArray = tags.split(",").map((tag) => tag.trim());
      query.tags = { $in: tagArray };
    }

    if (search) {
      query.$text = { $search: search };
    }

    if (isAdult === "false") {
      query.isAdult = false;
    } else if (isAdult === "true") {
      query.isAdult = true;
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query with population
    const [videos, total] = await Promise.all([
      Video.find(query)
        .populate("idol", "name stageName slug profileImage")
        .populate("genres", "name slug color")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Video.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: videos,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    logger.error("Error fetching videos:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch videos" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const session = await auth();
    if (!session || (session.user as AuthenticatedUser)?.role !== "admin") {
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
    const {
      title,
      idol,
      thumbnailUrl,
      videoSourceUrl,
      channelAvatar,
      channelName,
      duration,
    } = body;
    if (
      !title ||
      !idol ||
      !thumbnailUrl ||
      !videoSourceUrl ||
      !channelAvatar ||
      !channelName ||
      !duration
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Create video
    const video = await Video.create({
      ...body,
      thumbnailUrl: body.thumbnailUrl,
      thumbnailUploadKey: body.thumbnailUploadKey,
      videoSourceUrl: body.videoSourceUrl,
      videoUploadKey: body.videoUploadKey
    });

    // Update idol video count
    if (video.idol) {
      await Idol.findByIdAndUpdate(video.idol, {
        $inc: { videoCount: 1 },
      });
    }

    // Update genre video counts
    if (video.genres && video.genres.length > 0) {
      await Genre.updateMany(
        { _id: { $in: video.genres } },
        { $inc: { "contentCounts.videos": 1 } },
      );
    }

    // Populate the created video
    const populatedVideo = await Video.findById(video._id)
      .populate("idol", "name stageName slug profileImage")
      .populate("genres", "name slug color");

    return NextResponse.json(
      {
        success: true,
        data: populatedVideo,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    logger.error("Error creating video:", error);
    const err = error as { name?: string; errors?: unknown };

    if (err.name === "ValidationError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.errors },
        { status: 400 },
      );
    }

    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json(
        { success: false, error: "A video with this slug already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create video" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const session = await auth();
    if (!session || (session.user as AuthenticatedUser)?.role !== "admin") {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Video ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();

    // Get the current video to compare changes
    const currentVideo = await Video.findById(id);
    if (!currentVideo) {
      return NextResponse.json(
        { success: false, error: "Video not found" },
        { status: 404 },
      );
    }

    // Update video
    const updatedVideo = await Video.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    })
      .populate("idol", "name stageName slug profileImage")
      .populate("genres", "name slug color");

    if (!updatedVideo) {
      return NextResponse.json(
        { success: false, error: "Video not found" },
        { status: 404 },
      );
    }

    // Update idol counts if idol changed
    if (currentVideo.idol?.toString() !== updatedVideo.idol?._id?.toString()) {
      if (currentVideo.idol) {
        await Idol.findByIdAndUpdate(currentVideo.idol, {
          $inc: { videoCount: -1 },
        });
      }
      if (updatedVideo.idol) {
        await Idol.findByIdAndUpdate(updatedVideo.idol._id, {
          $inc: { videoCount: 1 },
        });
      }
    }

    // Update genre counts if genres changed
    const oldGenres =
      currentVideo.genres?.map((g: unknown) => {
        if (typeof g === "object" && g !== null && "_id" in g) {
          return (g as { _id: mongoose.Types.ObjectId })._id.toString();
        }
        return (g as mongoose.Types.ObjectId).toString();
      }) || [];
    const newGenres =
      updatedVideo.genres?.map((g: unknown) => {
        if (typeof g === "object" && g !== null && "_id" in g) {
          return (g as { _id: mongoose.Types.ObjectId })._id.toString();
        }
        return (g as mongoose.Types.ObjectId).toString();
      }) || [];

    const addedGenres = newGenres.filter((g: string) => !oldGenres.includes(g));
    const removedGenres = oldGenres.filter(
      (g: string) => !newGenres.includes(g),
    );

    await Promise.all([
      Genre.updateMany(
        { _id: { $in: addedGenres } },
        { $inc: { "contentCounts.videos": 1 } },
      ),
      Genre.updateMany(
        { _id: { $in: removedGenres } },
        { $inc: { "contentCounts.videos": -1 } },
      ),
    ]);

    return NextResponse.json({
      success: true,
      data: updatedVideo,
    });
  } catch (error: unknown) {
    logger.error("Error updating video:", error);
    const err = error as { name?: string; errors?: unknown };

    if (err.name === "ValidationError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.errors },
        { status: 400 },
      );
    }

    const errWithCode = error as { code?: number };
    if (errWithCode.code === 11000) {
      return NextResponse.json(
        { success: false, error: "A video with this slug already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update video" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const session = await auth();
    if (!session || (session.user as AuthenticatedUser)?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const origin = request.headers.get("origin");
    const originAllowed = isOriginAllowed(origin, request.url);
    if (!originAllowed) {
      return NextResponse.json(
        { success: false, error: "Bad origin" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const ids = searchParams.get("ids");
    if (!ids) {
      return NextResponse.json(
        { success: false, error: "Video IDs are required" },
        { status: 400 }
      );
    }

    const videoIds = ids.split(",").map((s) => s.trim());

    // ✅ Get UploadThing keys
    const videos = await Video.find({ _id: { $in: videoIds } }).select(
      "thumbnailUploadKey videoUploadKey idol genres"
    );

    // Collect all keys into one array
    const keys: string[] = [];
    for (const v of videos) {
      if (v.thumbnailUploadKey) keys.push(v.thumbnailUploadKey);
      if (v.videoUploadKey) keys.push(v.videoUploadKey);
    }

    // ✅ Delete from UploadThing first
    if (keys.length > 0) {
      try {
        await deleteUploadThingFiles(keys);
        console.log(`🧹 Deleted ${keys.length} UploadThing file(s).`);
      } catch (err) {
        console.warn("⚠ UploadThing deletion failed.", err);
      }
    }

    // ✅ Delete from MongoDB
    const result = await Video.deleteMany({ _id: { $in: videoIds } });

    // ✅ Update idol and genre counters
    const idolUpdates = new Map<string, number>();
    const genreUpdates = new Map<string, number>();
    videos.forEach((v) => {
      if (v.idol) {
        const key = v.idol.toString();
        idolUpdates.set(key, (idolUpdates.get(key) || 0) + 1);
      }
      v.genres?.forEach((g) => {
        const key = g.toString();
        genreUpdates.set(key, (genreUpdates.get(key) || 0) + 1);
      });
    });

    await Promise.all([
      ...Array.from(idolUpdates.entries()).map(([i, n]) =>
        Idol.findByIdAndUpdate(i, { $inc: { videoCount: -n } })
      ),
      ...Array.from(genreUpdates.entries()).map(([g, n]) =>
        Genre.findByIdAndUpdate(g, {
          $inc: { "contentCounts.videos": -n },
        })
      ),
    ]);

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} video(s) deleted successfully.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    logger.error("Error deleting videos:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete videos" },
      { status: 500 }
    );
  }
}
