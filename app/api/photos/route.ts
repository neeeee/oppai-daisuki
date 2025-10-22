import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../lib/mongodb";
import Photo from "../../models/Photo";
import Gallery from "../../models/Gallery";
import Idol from "../../models/Idol";

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
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build query
    const query: any = { isPublic: true };

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
      const tagArray = tags.split(",").map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
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
    });
  } catch (error) {
    console.error("Error fetching photos:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch photos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    // Validate required fields
    const { title, imageUrl, thumbnailUrl } = body;
    if (!title || !imageUrl || !thumbnailUrl) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: title, imageUrl, thumbnailUrl" },
        { status: 400 }
      );
    }

    // Create photo
    const photo = await Photo.create(body);

    // Update related gallery photo count if gallery is specified
    if (photo.gallery) {
      await Gallery.findByIdAndUpdate(
        photo.gallery,
        { $inc: { photoCount: 1 } }
      );
    }

    // Update related idol photo count if idol is specified
    if (photo.idol) {
      await Idol.findByIdAndUpdate(
        photo.idol,
        { $inc: { photoCount: 1 } }
      );
    }

    // Populate the created photo
    const populatedPhoto = await Photo.findById(photo._id)
      .populate("gallery", "title slug")
      .populate("idol", "name stageName slug profileImage");

    return NextResponse.json({
      success: true,
      data: populatedPhoto,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating photo:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create photo" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const ids = searchParams.get("ids");

    if (!ids) {
      return NextResponse.json(
        { success: false, error: "Photo IDs are required" },
        { status: 400 }
      );
    }

    const photoIds = ids.split(",");

    // Get photos before deletion to update counters
    const photos = await Photo.find({ _id: { $in: photoIds } });

    // Delete photos
    const result = await Photo.deleteMany({ _id: { $in: photoIds } });

    // Update gallery and idol counters
    const galleryUpdates = new Map();
    const idolUpdates = new Map();

    photos.forEach(photo => {
      if (photo.gallery) {
        galleryUpdates.set(photo.gallery.toString(),
          (galleryUpdates.get(photo.gallery.toString()) || 0) + 1
        );
      }
      if (photo.idol) {
        idolUpdates.set(photo.idol.toString(),
          (idolUpdates.get(photo.idol.toString()) || 0) + 1
        );
      }
    });

    // Update counters
    await Promise.all([
      ...Array.from(galleryUpdates.entries()).map(([galleryId, count]) =>
        Gallery.findByIdAndUpdate(galleryId, { $inc: { photoCount: -count } })
      ),
      ...Array.from(idolUpdates.entries()).map(([idolId, count]) =>
        Idol.findByIdAndUpdate(idolId, { $inc: { photoCount: -count } })
      ),
    ]);

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} photos deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting photos:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete photos" },
      { status: 500 }
    );
  }
}
