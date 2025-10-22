import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../lib/mongodb";
import Idol from "../../models/Idol";
import Genre from "../../models/Genre";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const status = searchParams.get("status");
    const genre = searchParams.get("genre");
    const tags = searchParams.get("tags");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const featured = searchParams.get("featured");
    const verified = searchParams.get("verified");

    // Build query
    const query: any = { isPublic: true };

    if (status) {
      query.status = status;
    }

    if (genre) {
      query.genres = genre;
    }

    if (tags) {
      const tagArray = tags.split(",").map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    if (search) {
      query.$text = { $search: search };
    }

    if (featured === "true") {
      query["metadata.featured"] = true;
    }

    if (verified === "true") {
      query.isVerified = true;
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query with population
    const [idols, total] = await Promise.all([
      Idol.find(query)
        .populate("genres", "name slug color")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Idol.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: idols,
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
    console.error("Error fetching idols:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch idols" },
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

    // Create idol
    const idol = await Idol.create(body);

    // Update genre idol counts if genres are specified
    if (idol.genres && idol.genres.length > 0) {
      await Genre.updateMany(
        { _id: { $in: idol.genres } },
        { $inc: { "contentCounts.idols": 1 } }
      );
    }

    // Populate the created idol
    const populatedIdol = await Idol.findById(idol._id)
      .populate("genres", "name slug color");

    return NextResponse.json({
      success: true,
      data: populatedIdol,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating idol:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "An idol with this slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create idol" },
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
        { success: false, error: "Idol ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Get the current idol to compare genres
    const currentIdol = await Idol.findById(id);
    if (!currentIdol) {
      return NextResponse.json(
        { success: false, error: "Idol not found" },
        { status: 404 }
      );
    }

    // Update idol
    const updatedIdol = await Idol.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    ).populate("genres", "name slug color");

    if (!updatedIdol) {
      return NextResponse.json(
        { success: false, error: "Idol not found" },
        { status: 404 }
      );
    }

    // Update genre counts if genres changed
    const oldGenres = currentIdol.genres?.map(g => g.toString()) || [];
    const newGenres = updatedIdol.genres?.map(g => g._id.toString()) || [];

    const addedGenres = newGenres.filter(g => !oldGenres.includes(g));
    const removedGenres = oldGenres.filter(g => !newGenres.includes(g));

    await Promise.all([
      Genre.updateMany(
        { _id: { $in: addedGenres } },
        { $inc: { "contentCounts.idols": 1 } }
      ),
      Genre.updateMany(
        { _id: { $in: removedGenres } },
        { $inc: { "contentCounts.idols": -1 } }
      ),
    ]);

    return NextResponse.json({
      success: true,
      data: updatedIdol,
    });
  } catch (error) {
    console.error("Error updating idol:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "An idol with this slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update idol" },
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
        { success: false, error: "Idol IDs are required" },
        { status: 400 }
      );
    }

    const idolIds = ids.split(",");

    // Get idols before deletion to update genre counters
    const idols = await Idol.find({ _id: { $in: idolIds } });

    // Delete idols
    const result = await Idol.deleteMany({ _id: { $in: idolIds } });

    // Update genre counters
    const genreUpdates = new Map();

    idols.forEach(idol => {
      if (idol.genres && idol.genres.length > 0) {
        idol.genres.forEach(genreId => {
          const genreIdStr = genreId.toString();
          genreUpdates.set(genreIdStr,
            (genreUpdates.get(genreIdStr) || 0) + 1
          );
        });
      }
    });

    // Update genre counters
    await Promise.all(
      Array.from(genreUpdates.entries()).map(([genreId, count]) =>
        Genre.findByIdAndUpdate(genreId, { $inc: { "contentCounts.idols": -count } })
      )
    );

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} idols deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting idols:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete idols" },
      { status: 500 }
    );
  }
}
