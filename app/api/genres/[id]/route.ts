import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Genre from "@/models/Genre";
import Video from "@/models/Video";
import Photo from "@/models/Photo";
import Gallery from "@/models/Gallery";
import Idol from "@/models/Idol";
import logger from "@/lib/utils/logger";
import mongoose from "mongoose";

interface LeanGenre {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  coverImage?: string;
  parentGenre?: {
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    color?: string;
  };
  subGenres?: Array<{
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    color?: string;
    description?: string;
  }>;
  tags?: string[];
  contentCounts: {
    photos: number;
    videos: number;
    galleries: number;
    idols: number;
    news: number;
  };
  metadata: {
    featured: boolean;
  };
}

interface LeanIdol {
  _id: mongoose.Types.ObjectId | string;
  contentCounts?: { photos: number; galleries: number; videos: number };
  [key: string]: unknown;
}

interface ContentData {
  videos: unknown[];
  photos: unknown[];
  galleries: unknown[];
  idols: LeanIdol[];
}

interface ResponseData {
  genre: LeanGenre;
  content: ContentData;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const contentType = (searchParams.get("contentType") || "all") as
      | "all"
      | "videos"
      | "photos"
      | "galleries"
      | "idols";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "24", 10);
    const skip = (page - 1) * limit;

    // Find genre
    const genreResult = await Genre.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(id) ? id : null },
        { slug: id },
      ],
    })
      .populate("parentGenre", "name slug color")
      .populate("subGenres", "name slug color description")
      .lean();

    if (!genreResult) {
      return NextResponse.json(
        { success: false, error: "Genre not found" },
        { status: 404 },
      );
    }

    const genre = genreResult as unknown as LeanGenre;
    const genreId = genre._id;

    const data: ResponseData = {
      genre,
      content: {
        videos: [],
        photos: [],
        galleries: [],
        idols: [],
      },
      pagination: null,
    };

    if (contentType === "all" || contentType === "videos") {
      const videoQuery = Video.find({ genres: genreId, isPublic: true }).sort({
        createdAt: -1,
      });

      if (contentType === "videos") {
        videoQuery.skip(skip).limit(limit);
      } else {
        videoQuery.limit(8);
      }

      data.content.videos = await videoQuery.lean();

      if (contentType === "videos") {
        const totalVideos = await Video.countDocuments({
          genres: genreId,
          isPublic: true,
        });
        data.pagination = {
          currentPage: page,
          totalPages: Math.ceil(totalVideos / limit),
          totalItems: totalVideos,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(totalVideos / limit),
          hasPrevPage: page > 1,
        };
      }
    }

    if (contentType === "all" || contentType === "photos") {
      const photoQuery = Photo.find({ genres: genreId, isPublic: true }).sort({
        uploadDate: -1,
      });

      if (contentType === "photos") {
        photoQuery.skip(skip).limit(limit);
      } else {
        photoQuery.limit(12);
      }

      data.content.photos = await photoQuery.lean();

      if (contentType === "photos") {
        const totalPhotos = await Photo.countDocuments({
          genres: genreId,
          isPublic: true,
        });
        data.pagination = {
          currentPage: page,
          totalPages: Math.ceil(totalPhotos / limit),
          totalItems: totalPhotos,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(totalPhotos / limit),
          hasPrevPage: page > 1,
        };
      }
    }

    if (contentType === "all" || contentType === "galleries") {
      const galleryQuery = Gallery.find({
        genres: genreId,
        isPublic: true,
      }).sort({ createdAt: -1 });

      if (contentType === "galleries") {
        galleryQuery.skip(skip).limit(limit);
      } else {
        galleryQuery.limit(8);
      }

      data.content.galleries = await galleryQuery.lean();

      if (contentType === "galleries") {
        const totalGalleries = await Gallery.countDocuments({
          genres: genreId,
          isPublic: true,
        });
        data.pagination = {
          currentPage: page,
          totalPages: Math.ceil(totalGalleries / limit),
          totalItems: totalGalleries,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(totalGalleries / limit),
          hasPrevPage: page > 1,
        };
      }
    }

    if (contentType === "all" || contentType === "idols") {
      const idolQuery = Idol.find({ genres: genreId, isPublic: true })
        .populate("genres", "name slug color")
        .sort({ viewCount: -1 });

      if (contentType === "idols") {
        idolQuery.skip(skip).limit(limit);
      } else {
        idolQuery.limit(8);
      }

      const idolsResult = await idolQuery.lean();
      const idols = idolsResult as unknown as LeanIdol[];

      const idolIds = idols.map((idol) => idol._id);

      const [photoCounts, galleryCounts, videoCounts] = await Promise.all([
        Photo.aggregate([
          { $match: { idol: { $in: idolIds }, isPublic: true } },
          { $group: { _id: "$idol", count: { $sum: 1 } } },
        ]),
        Gallery.aggregate([
          { $match: { idol: { $in: idolIds }, isPublic: true } },
          { $group: { _id: "$idol", count: { $sum: 1 } } },
        ]),
        Video.aggregate([
          { $match: { idol: { $in: idolIds }, isPublic: true } },
          { $group: { _id: "$idol", count: { $sum: 1 } } },
        ]),
      ]);

      const photosMap = new Map(
        photoCounts.map((p) => [p._id.toString(), p.count]),
      );
      const galleriesMap = new Map(
        galleryCounts.map((g) => [g._id.toString(), g.count]),
      );
      const videosMap = new Map(
        videoCounts.map((v) => [v._id.toString(), v.count]),
      );

      idols.forEach((idol) => {
        idol.contentCounts = {
          photos: photosMap.get(idol._id.toString()) || 0,
          galleries: galleriesMap.get(idol._id.toString()) || 0,
          videos: videosMap.get(idol._id.toString()) || 0,
        };
      });

      data.content.idols = idols;

      if (contentType === "idols") {
        const totalIdols = await Idol.countDocuments({
          genres: genreId,
          isPublic: true,
        });
        data.pagination = {
          currentPage: page,
          totalPages: Math.ceil(totalIdols / limit),
          totalItems: totalIdols,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(totalIdols / limit),
          hasPrevPage: page > 1,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error("Error fetching genre:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch genre" },
      { status: 500 },
    );
  }
}
