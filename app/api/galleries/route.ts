// src/app/api/galleries/route.ts

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Gallery from "@/models/Gallery";
import Idol from "@/models/Idol";
import Genre from "@/models/Genre";
import Photo from "@/models/Photo";
import { auth } from "@/lib/auth";
import { isOriginAllowed } from "@/lib/utils/origin-validation";
import logger from "@/lib/utils/logger";
import { deleteUploadThingFiles } from "@/lib/utils/uploadthing/deleteFiles";

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
      includePrivate = !!(
        includePrivateQuery && session?.user?.role === "admin"
      );
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
    if (idol && mongoose.Types.ObjectId.isValid(idol)) {
      query.idol = new mongoose.Types.ObjectId(idol);
    }
    if (genre && mongoose.Types.ObjectId.isValid(genre)) {
      query.genres = new mongoose.Types.ObjectId(genre);
    }
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

    const [galleries, total] = await Promise.all([
      Gallery.aggregate([
        { $match: query },
        {
          $addFields: {
            photos: {
              $filter: {
                input: "$photos",
                as: "p",
                cond: {
                  $eq: [
                    { $type: "$$p" },
                    "objectId",
                  ]
                }
              }
            }
          }
        },
        { $sort: sort },
        { $skip: skip }, 
        { $limit: limit },
      ]),
      Gallery.countDocuments(query),
    ]);

    await Gallery.populate(galleries, [
      { path: "idol", select: "name stageName slug profileImage"},
      { path: "genres", select: "name slug color"},
      { path: "photos", select: "imageUrl thumbnailUrl uploadThingKey"},
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

export async function POST(req: Request) {
  await dbConnect();

  const body = await req.json();
  const { title, photos = [] } = body;

  if (!title) {
    return NextResponse.json(
      { success: false, error: "Missing title" },
      { status: 400 },
    );
  }

  // ✅ 1. Create the gallery first
  const gallery = await Gallery.create({
    ...body,
    photos: [],
    photoCount: 0,
  });

  // ✅ 2. Create Photo docs for each URL
  if (photos.length) {
    const photoDocs = photos.map((url: string, i: number) => {
      const filename = url.split("/").pop() ?? "";
      const numericOrder =
      parseInt(filename.match(/\d+/)?.[0] || String(i), 10) || i;
      return {
      title: `${title} Photo ${i + 1}`,
      imageUrl: url,
      thumbnailUrl: url,
      uploadThingKey: url.split("/f/")[1]?.split("?")[0],
      gallery: gallery._id,
      order: numericOrder,
      slug: `${gallery.slug}-photo-${i + 1}`,
    }
  });

    const createdPhotos = await Photo.insertMany(photoDocs);

    // ✅ 3. Link them back to the gallery
    await Gallery.findByIdAndUpdate(gallery._id, {
      $set: { photos: createdPhotos.map((p) => p._id) },
      $setOnInsert: { coverPhoto: createdPhotos[0].imageUrl,
                      photoCount: createdPhotos.length
       },
    });
  }

  const populated = await Gallery.findById(gallery._id)
    .populate("photos")
    .lean();

  return NextResponse.json({ success: true, data: populated }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const session = await auth();
    if (!session || session.user?.role !== "admin") {
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
        { success: false, error: "Gallery ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();

    // Exclude photos from direct update - photos are managed as separate Photo documents
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { photos, ...updateData } = body;

    // Get current gallery to compare references
    const current = await Gallery.findById(id);
    if (!current) {
      return NextResponse.json(
        { success: false, error: "Gallery not found" },
        { status: 404 },
      );
    }
    const oldIdol = current.idol?.toString() || null;
    const oldGenres = (current.genres || []).map((g: mongoose.Types.ObjectId) => g.toString());

    // Update gallery
    const updated = await Gallery.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("idol", "name stageName slug profileImage")
      .populate("genres", "name slug color");

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Gallery not found" },
        { status: 404 },
      );
    }

    // Adjust related counters if references changed
    const newIdol =
      typeof body.idol !== "undefined" ? (body.idol ?? null) : oldIdol;
    const newGenres: string[] =
      typeof body.genres !== "undefined" 
        ? (body.genres || []).map((g: string) => g.toString()) 
        : oldGenres;

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

    // Handle genres array changes
    const removedGenres = oldGenres.filter((g: string) => !newGenres.includes(g));
    const addedGenres = newGenres.filter((g: string) => !oldGenres.includes(g));

    for (const genreId of removedGenres) {
      ops.push(
        Genre.findByIdAndUpdate(genreId, {
          $inc: { "contentCounts.galleries": -1 },
        }),
      );
    }
    for (const genreId of addedGenres) {
      ops.push(
        Genre.findByIdAndUpdate(genreId, {
          $inc: { "contentCounts.galleries": 1 },
        }),
      );
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

// Find and remove associated photos and their files
const photos = await Photo.find({ gallery: { $in: ids } })
  .select("_id uploadThingKey imageUrl gallery")
  .lean();

if (photos.length > 0) {
  const uploadKeys = photos
    .map((p) => p.uploadThingKey)
    .filter(Boolean) as string[];

  // Delete UploadThing files
  if (uploadKeys.length > 0) {
    const { deleteUploadThingFiles } = await import("@/lib/utils/uploadthing/deleteFiles");
    await deleteUploadThingFiles(uploadKeys);
  }

  // Delete photo documents
  await Photo.deleteMany({ gallery: { $in: ids } });
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


    const coverPhotoKeys = await Gallery.find({ _id: { $in: ids  }}).select("coverPhotoKey");
    const galleryKeys = coverPhotoKeys.map((g) => g.coverPhotoKey).filter(Boolean);

    if (galleryKeys.length) await deleteUploadThingFiles(galleryKeys);
    await Gallery.deleteMany({ _id: { $in: ids } });

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
      message: `Gallery deleted successfully`,
    });
  } catch (error) {
    logger.error("Error deleting galleries:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete galleries" },
      { status: 500 },
    );
  }
}