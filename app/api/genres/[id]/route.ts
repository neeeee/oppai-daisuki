import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../lib/mongodb";
import Genre from "../../../models/Genre";
import Photo from "../../../models/Photo";
import Gallery from "../../../models/Gallery";
import Video from "../../../models/Video";
import Idol from "../../../models/Idol";
import mongoose from "mongoose";
import logger from "@/lib/utils/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get("contentType") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "24", 10);

    // Check if id is a valid ObjectId, if not treat as slug
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { slug: id };

    // Find the genre and populate parent/subgenres
    const genre = await Genre.findOne({ ...query, isPublic: true })
      .populate("parentGenre", "name slug color")
      .populate("subGenres", "name slug color description")
      .lean();

    if (!genre) {
      return NextResponse.json(
        { success: false, error: "Genre not found" },
        { status: 404 },
      );
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Fetch content based on type
    const content: {
      photos?: Array<Record<string, unknown>>;
      galleries?: Array<Record<string, unknown>>;
      idols?: Array<Record<string, unknown>>;
      videos?: Array<Record<string, unknown>>;
    } = {};
    let totalCount = 0;

    if (contentType === "all" || contentType === "photos") {
      const [photos, photosCount] = await Promise.all([
        Photo.find({
          category: (genre as unknown as { name: string }).name,
          isPublic: true,
        })
          .sort({ createdAt: -1 })
          .skip(contentType === "photos" ? skip : 0)
          .limit(contentType === "photos" ? limit : 12)
          .select(
            "title imageUrl thumbnailUrl slug viewCount likeCount createdAt isAdult",
          )
          .populate("idol", "name stageName slug")
          .lean(),
        Photo.countDocuments({
          category: (genre as unknown as { name: string }).name,
          isPublic: true,
        }),
      ]);
      content.photos = photos;
      if (contentType === "photos") totalCount = photosCount;
    }

    if (contentType === "all" || contentType === "galleries") {
      const [galleries, galleriesCount] = await Promise.all([
        Gallery.find({
          genre: (genre as unknown as { _id: unknown })._id,
          isPublic: true,
        })
          .sort({ createdAt: -1 })
          .skip(contentType === "galleries" ? skip : 0)
          .limit(contentType === "galleries" ? limit : 12)
          .select(
            "title coverPhoto slug photoCount viewCount likeCount createdAt description",
          )
          .populate("idol", "name stageName slug")
          .lean(),
        Gallery.countDocuments({
          genre: (genre as unknown as { _id: unknown })._id,
          isPublic: true,
        }),
      ]);
      content.galleries = galleries;
      if (contentType === "galleries") totalCount = galleriesCount;
    }

    if (contentType === "all" || contentType === "idols") {
      const [idols, idolsCount] = await Promise.all([
        Idol.find({
          genres: (genre as unknown as { _id: unknown })._id,
          isPublic: true,
        })
          .sort({ viewCount: -1 })
          .skip(contentType === "idols" ? skip : 0)
          .limit(contentType === "idols" ? limit : 20)
          .select(
            "name stageName slug profileImage coverImage viewCount photoCount videoCount galleryCount metadata",
          )
          .lean(),
        Idol.countDocuments({
          genres: (genre as unknown as { _id: unknown })._id,
          isPublic: true,
        }),
      ]);
      content.idols = idols;
      if (contentType === "idols") totalCount = idolsCount;
    }

    // For videos, we'll use a simple approach since Video model doesn't have genre field
    if (contentType === "all" || contentType === "videos") {
      const [videos, videosCount] = await Promise.all([
        Video.find({})
          .sort({ createdAt: -1 })
          .skip(contentType === "videos" ? skip : 0)
          .limit(contentType === "videos" ? limit : 12)
          .select(
            "title thumbnailUrl duration viewCount channelName channelAvatar createdAt",
          )
          .lean(),
        Video.countDocuments({}),
      ]);
      content.videos = videos;
      if (contentType === "videos") totalCount = videosCount;
    }

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        genre,
        content,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching genre:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch genre" },
      { status: 500 },
    );
  }
}
