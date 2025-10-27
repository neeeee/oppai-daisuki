import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Gallery from "@/models/Gallery";
import Idol from "@/models/Idol";
import Genre from "@/models/Genre";
import Photo from "@/models/Photo";
import { auth } from "@/lib/auth";
import logger from "@/lib/utils/logger";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const category = searchParams.get("category");
    const idol = searchParams.get("idol");
    const genre = searchParams.get("genre");
    const tags = searchParams.get("tags");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const includePrivateQuery = searchParams.get("includePrivate") === "true";
    let includePrivate = false;
    try {
      const session = await auth();
      includePrivate = !!(includePrivateQuery && session?.user?.role === "admin");
    } catch {
      includePrivate = false;
    }
    const includeStats = searchParams.get("includeStats") === "true";

    // Build query
    const query: Record<string, unknown> = {};
    if (!includePrivate) {
      query.isPublic = true;
    }
    if (category) query.category = category;
    if (idol) query.idol = idol;
    if (genre) query.genre = genre;
    if (tags) {
      const tagArray = tags.split(",").map((t) => t.trim());
      query.tags = { $in: tagArray };
    }
    if (search) {
      query.$text = { $search: search };
    }

    // Pagination and sorting
    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute
    const [galleries, total] = await Promise.all([
      Gallery.find(query)
        .populate("idol", "name stageName slug profileImage")
        .populate("genre", "name slug color")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Gallery.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Optional stats
    let stats = null as null | {
      totalGalleries: number;
      publicCount: number;
      privateCount: number;
    };
    if (includeStats) {
      const [totalGalleries, publicCount, privateCount] = await Promise.all([
        Gallery.countDocuments({}),
        Gallery.countDocuments({ isPublic: true }),
        Gallery.countDocuments({ isPublic: false }),
      ]);
      stats = { totalGalleries, publicCount, privateCount };
    }

    return NextResponse.json({
      success: true,
      data: galleries,
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
  } catch (error) {
    logger.error("Error fetching galleries:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch galleries" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const origin = request.headers.get("origin");
    const baseUrl = process.env.NEXTAUTH_URL || new URL(request.url).origin;
    if (origin && !origin.startsWith(baseUrl)) {
      return NextResponse.json({ success: false, error: "Bad origin" }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    const { title } = body || {};
    if (!title) {
      return NextResponse.json(
        { success: false, error: "Missing required field: title" },
        { status: 400 },
      );
    }

    // Create gallery
    const gallery = await Gallery.create(body);

    // Update related counters
    const incOps: Promise<unknown>[] = [];
    if (gallery.idol) {
      incOps.push(
        Idol.findByIdAndUpdate(gallery.idol, { $inc: { galleryCount: 1 } }),
      );
    }
    if (gallery.genre) {
      incOps.push(
        Genre.findByIdAndUpdate(gallery.genre, {
          $inc: { "contentCounts.galleries": 1 },
        }),
      );
    }
    if (incOps.length > 0) {
      await Promise.all(incOps);
    }

    // Populate result
    const populated = await Gallery.findById(gallery._id)
      .populate("idol", "name stageName slug profileImage")
      .populate("genre", "name slug color");

    return NextResponse.json(
      { success: true, data: populated },
      { status: 201 },
    );
  } catch (error: unknown) {
    const err = error as { name?: string; code?: number; errors?: unknown };
    logger.error("Error creating gallery:", err);

    if (err?.name === "ValidationError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.errors },
        { status: 400 },
      );
    }
    if (err?.code === 11000) {
      return NextResponse.json(
        { success: false, error: "A gallery with this slug already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create gallery" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const origin = request.headers.get("origin");
    const baseUrl = process.env.NEXTAUTH_URL || new URL(request.url).origin;
    if (origin && !origin.startsWith(baseUrl)) {
      return NextResponse.json({ success: false, error: "Bad origin" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Gallery ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();

    // Get current gallery to compare references
    const current = await Gallery.findById(id);
    if (!current) {
      return NextResponse.json(
        { success: false, error: "Gallery not found" },
        { status: 404 },
      );
    }
    const oldIdol = current.idol?.toString() || null;
    const oldGenre = current.genre?.toString() || null;

    // Update gallery
    const updated = await Gallery.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    })
      .populate("idol", "name stageName slug profileImage")
      .populate("genre", "name slug color");

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Gallery not found" },
        { status: 404 },
      );
    }

    // Adjust related counters if references changed
    const newIdol =
      typeof body.idol !== "undefined" ? (body.idol ?? null) : oldIdol;
    const newGenre =
      typeof body.genre !== "undefined" ? (body.genre ?? null) : oldGenre;

    const ops: Promise<unknown>[] = [];

    if (oldIdol !== newIdol) {
      if (oldIdol) {
        ops.push(
          Idol.findByIdAndUpdate(oldIdol, { $inc: { galleryCount: -1 } }),
        );
      }
      if (newIdol) {
        ops.push(
          Idol.findByIdAndUpdate(newIdol, { $inc: { galleryCount: 1 } }),
        );
      }
    }

    if (oldGenre !== newGenre) {
      if (oldGenre) {
        ops.push(
          Genre.findByIdAndUpdate(oldGenre, {
            $inc: { "contentCounts.galleries": -1 },
          }),
        );
      }
      if (newGenre) {
        ops.push(
          Genre.findByIdAndUpdate(newGenre, {
            $inc: { "contentCounts.galleries": 1 },
          }),
        );
      }
    }

    if (ops.length > 0) {
      await Promise.all(ops);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const err = error as { name?: string; code?: number; errors?: unknown };
    logger.error("Error updating gallery:", err);

    if (err?.name === "ValidationError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.errors },
        { status: 400 },
      );
    }
    if (err?.code === 11000) {
      return NextResponse.json(
        { success: false, error: "A gallery with this slug already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update gallery" },
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
    const baseUrl = process.env.NEXTAUTH_URL || new URL(request.url).origin;
    if (origin && !origin.startsWith(baseUrl)) {
      return NextResponse.json({ success: false, error: "Bad origin" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json(
        { success: false, error: "Gallery IDs are required" },
        { status: 400 },
      );
    }

    const ids = idsParam.split(",").map((s) => s.trim());

    // Fetch galleries to compute counter updates and check constraints
    const galleries = await Gallery.find({ _id: { $in: ids } });

    if (galleries.length === 0) {
      return NextResponse.json(
        { success: false, error: "No galleries found for provided IDs" },
        { status: 404 },
      );
    }

    // Optional safety: prevent deletion when photos still exist
    const photosExist = await Photo.countDocuments({ gallery: { $in: ids } });
    if (photosExist > 0) {
      const blocking = await Gallery.find({
        _id: { $in: ids },
        photoCount: { $gt: 0 },
      })
        .select("_id title photoCount")
        .lean();

      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot delete galleries that contain photos. Delete or reassign photos first.",
          blockingGalleries: blocking,
        },
        { status: 400 },
      );
    }

    // Build decrement maps for idols and genres
    const idolDec = new Map<string, number>();
    const genreDec = new Map<string, number>();

    for (const g of galleries) {
      if (g.idol) {
        const k = g.idol.toString();
        idolDec.set(k, (idolDec.get(k) || 0) + 1);
      }
      if (g.genre) {
        const k = g.genre.toString();
        genreDec.set(k, (genreDec.get(k) || 0) + 1);
      }
    }

    // Delete galleries
    const result = await Gallery.deleteMany({ _id: { $in: ids } });

    // Apply counter decrements
    const ops: Promise<unknown>[] = [];
    for (const [idolId, count] of idolDec.entries()) {
      ops.push(
        Idol.findByIdAndUpdate(idolId, { $inc: { galleryCount: -count } }),
      );
    }
    for (const [genreId, count] of genreDec.entries()) {
      ops.push(
        Genre.findByIdAndUpdate(genreId, {
          $inc: { "contentCounts.galleries": -count },
        }),
      );
    }
    if (ops.length > 0) {
      await Promise.all(ops);
    }

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} galleries deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    logger.error("Error deleting galleries:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete galleries" },
      { status: 500 },
    );
  }
}
