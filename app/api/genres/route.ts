import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../lib/mongodb";
import Genre from "../../models/Genre";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const parentGenre = searchParams.get("parentGenre");
    const featured = searchParams.get("featured");
    const trending = searchParams.get("trending");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "sortOrder";
    const sortOrder = searchParams.get("sortOrder") || "asc";
    const includeStats = searchParams.get("includeStats") === "true";

    // Build query
    const query: any = { isPublic: true };

    if (parentGenre === "null" || parentGenre === "root") {
      query.parentGenre = { $exists: false };
    } else if (parentGenre) {
      query.parentGenre = parentGenre;
    }

    if (featured === "true") {
      query["metadata.featured"] = true;
    }

    if (trending === "true") {
      query["metadata.trending"] = true;
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
    const [genres, total] = await Promise.all([
      Genre.find(query)
        .populate("parentGenre", "name slug")
        .populate("subGenres", "name slug color")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Genre.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Include additional stats if requested
    let stats = null;
    if (includeStats) {
      const [totalGenres, featuredCount, trendingCount] = await Promise.all([
        Genre.countDocuments({ isPublic: true }),
        Genre.countDocuments({ isPublic: true, "metadata.featured": true }),
        Genre.countDocuments({ isPublic: true, "metadata.trending": true }),
      ]);

      stats = {
        totalGenres,
        featuredCount,
        trendingCount,
      };
    }

    return NextResponse.json({
      success: true,
      data: genres,
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
    console.error("Error fetching genres:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch genres" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    // Validate required fields
    const { name } = body;
    if (!name) {
      return NextResponse.json(
        { success: false, error: "Missing required field: name" },
        { status: 400 }
      );
    }

    // Create genre
    const genre = await Genre.create(body);

    // Populate the created genre
    const populatedGenre = await Genre.findById(genre._id)
      .populate("parentGenre", "name slug")
      .populate("subGenres", "name slug color");

    return NextResponse.json({
      success: true,
      data: populatedGenre,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating genre:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "A genre with this name or slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create genre" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Genre ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Update genre
    const updatedGenre = await Genre.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    )
      .populate("parentGenre", "name slug")
      .populate("subGenres", "name slug color");

    if (!updatedGenre) {
      return NextResponse.json(
        { success: false, error: "Genre not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedGenre,
    });
  } catch (error) {
    console.error("Error updating genre:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "A genre with this name or slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update genre" },
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
        { success: false, error: "Genre IDs are required" },
        { status: 400 }
      );
    }

    const genreIds = ids.split(",");

    // Check if any of the genres have subgenres
    const genresWithSubgenres = await Genre.find({
      _id: { $in: genreIds },
      subGenres: { $exists: true, $not: { $size: 0 } }
    });

    if (genresWithSubgenres.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete genres that have subgenres. Please delete or reassign subgenres first.",
          genresWithSubgenres: genresWithSubgenres.map(g => ({ id: g._id, name: g.name }))
        },
        { status: 400 }
      );
    }

    // Check if genres are being used by content
    const genresInUse = await Promise.all([
      // Check if used by idols
      Genre.aggregate([
        { $match: { _id: { $in: genreIds.map(id => new mongoose.Types.ObjectId(id)) } } },
        { $lookup: { from: "idols", localField: "_id", foreignField: "genres", as: "idols" } },
        { $match: { "idols.0": { $exists: true } } },
        { $project: { name: 1, idolCount: { $size: "$idols" } } }
      ]),
      // Check if used by galleries
      Genre.aggregate([
        { $match: { _id: { $in: genreIds.map(id => new mongoose.Types.ObjectId(id)) } } },
        { $lookup: { from: "galleries", localField: "_id", foreignField: "genre", as: "galleries" } },
        { $match: { "galleries.0": { $exists: true } } },
        { $project: { name: 1, galleryCount: { $size: "$galleries" } } }
      ]),
      // Check if used by news
      Genre.aggregate([
        { $match: { _id: { $in: genreIds.map(id => new mongoose.Types.ObjectId(id)) } } },
        { $lookup: { from: "news", localField: "_id", foreignField: "relatedGenres", as: "news" } },
        { $match: { "news.0": { $exists: true } } },
        { $project: { name: 1, newsCount: { $size: "$news" } } }
      ])
    ]);

    const allGenresInUse = genresInUse.flat();

    if (allGenresInUse.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete genres that are being used by content.",
          genresInUse: allGenresInUse
        },
        { status: 400 }
      );
    }

    // Delete genres
    const result = await Genre.deleteMany({ _id: { $in: genreIds } });

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} genres deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting genres:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete genres" },
      { status: 500 }
    );
  }
}
