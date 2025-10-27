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

    // Find the idol and populate genres
    const idol = await Idol.findOne({ ...query, isPublic: true })
      .populate("genres", "name slug color")
      .lean();

    if (!idol) {
      return NextResponse.json(
        { success: false, error: "Idol not found" },
        { status: 404 },
      );
    }

    // Increment view count
    await Idol.findByIdAndUpdate((idol as { _id: unknown })._id, {
      $inc: { viewCount: 1 },
    });

    // Fetch related content in parallel
    const [photos, galleries, videos] = await Promise.all([
      // Get recent photos
      Photo.find({ idol: (idol as { _id: unknown })._id, isPublic: true })
        .sort({ createdAt: -1 })
        .limit(12)
        .select(
          "title imageUrl thumbnailUrl slug viewCount likeCount createdAt",
        )
        .lean(),

      // Get recent galleries
      Gallery.find({ idol: (idol as { _id: unknown })._id, isPublic: true })
        .sort({ createdAt: -1 })
        .limit(8)
        .select(
          "title coverPhoto slug photoCount viewCount likeCount createdAt description",
        )
        .lean(),

      // Get recent videos for this idol
      Video.find({ idol: (idol as { _id: unknown })._id, isPublic: true })
        .sort({ createdAt: -1 })
        .limit(6)
        .select(
          "title thumbnailUrl duration viewCount channelName channelAvatar createdAt",
        )
        .lean(),
    ]);

    // Calculate additional info
    const totalContent = {
      photos: photos.length,
      galleries: galleries.length,
      videos: videos.length,
      totalViews:
        photos.reduce((acc, photo) => acc + (photo.viewCount || 0), 0) +
        galleries.reduce((acc, gallery) => acc + (gallery.viewCount || 0), 0) +
        ((idol as { viewCount?: number }).viewCount || 0),
    };

    // Get related idols (same genres)
    const relatedIdols = await Idol.find({
      _id: { $ne: (idol as { _id: unknown })._id },
      genres: {
        $in:
          (idol as { genres?: GenreReference[] }).genres?.map(
            (g: GenreReference) => g._id,
          ) || [],
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
          age: (idol as { birthDate?: string }).birthDate
            ? calculateAge(
                new Date((idol as { birthDate?: string }).birthDate!),
              )
            : null,
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
