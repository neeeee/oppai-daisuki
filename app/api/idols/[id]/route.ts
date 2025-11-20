import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Idol from "@/models/Idol";
import Photo from "@/models/Photo";
import Gallery from "@/models/Gallery";
import Video from "@/models/Video";
import mongoose from "mongoose";
import logger from "@/lib/utils/logger";

interface GenreReference {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
}

interface IdolWithCounts {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  stageName?: string;
  profileImage?: string;
  coverImage?: string;
  description?: string;
  birthDate?: string;
  viewCount?: number;
  genres?: GenreReference[];
  isPublic?: boolean;
  contentCounts?: {
    photos: number;
    galleries: number;
    videos: number;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();

    const { id } = await params;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { slug: id };

    const idol = (await Idol.findOne({ ...query, isPublic: true })
      .populate("genres", "name slug color")
      .lean()) as IdolWithCounts | null;

    if (!idol) {
      return NextResponse.json(
        { success: false, error: "Idol not found" },
        { status: 404 },
      );
    }

    const idolId = idol._id;

    const [photos, galleries, videos] = await Promise.all([
      Photo.find({ idol: idolId, isPublic: true })
        .sort({ createdAt: -1 })
        .limit(12)
        .select(
          "title imageUrl thumbnailUrl slug viewCount likeCount createdAt",
        )
        .lean(),
      Gallery.find({ idol: idolId, isPublic: true })
        .sort({ createdAt: -1 })
        .limit(8)
        .select(
          "title coverPhoto slug photoCount viewCount likeCount createdAt description",
        )
        .lean(),
      Video.find({ idol: idolId, isPublic: true })
        .sort({ createdAt: -1 })
        // .limit(6)
        .select(
          "title thumbnailUrl duration viewCount channelName channelAvatar createdAt",
        )
        .lean(),
    ]);

    const [photoCount, galleryCount, videoCount] = await Promise.all([
      Photo.countDocuments({ idol: idolId, isPublic: true }),
      Gallery.countDocuments({ idol: idolId, isPublic: true }),
      Video.countDocuments({ idol: idolId, isPublic: true }),
    ]);

    idol.contentCounts = {
      photos: photoCount,
      galleries: galleryCount,
      videos: videoCount,
    };

    const totalViews =
      photos.reduce((sum, p) => sum + (p.viewCount || 0), 0) +
      galleries.reduce((sum, g) => sum + (g.viewCount || 0), 0) +
      videos.reduce((sum, v) => sum + (v.viewCount || 0), 0) +
      (idol.viewCount || 0);

    const totalContent = {
      photos: photoCount,
      galleries: galleryCount,
      videos: videoCount,
      totalViews,
    };

    const relatedIdols = await Idol.find({
      _id: { $ne: idolId },
      genres: {
        $in: idol.genres?.map((g) => g._id) || [],
      },
      isPublic: true,
    })
      .limit(4)
      .select("name stageName slug profileImage viewCount")
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        idol: {
          ...idol,
          age: idol.birthDate ? calculateAge(new Date(idol.birthDate)) : null,
        },
        content: {
          photos,
          galleries,
          videos,
          stats: totalContent,
        },
        relatedIdols,
      },
    });
  } catch (error) {
    logger.error("Error fetching idol:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch idol" },
      { status: 500 },
    );
  }
}

function calculateAge(birthDate: Date): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}
