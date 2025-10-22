import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../lib/mongodb";
import News from "../../models/News";
import Idol from "../../models/Idol";
import Genre from "../../models/Genre";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const featured = searchParams.get("featured");
    const breaking = searchParams.get("breaking");
    const author = searchParams.get("author");
    const idol = searchParams.get("idol");
    const genre = searchParams.get("genre");
    const tags = searchParams.get("tags");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "publishedAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const includeUnpublished = searchParams.get("includeUnpublished") === "true";

    // Build query
    const query: any = {};

    if (!includeUnpublished) {
      query.status = "published";
      query.isPublic = true;
      query.$or = [
        { publishedAt: { $lte: new Date() } },
        { publishedAt: { $exists: false } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (status && includeUnpublished) {
      query.status = status;
    }

    if (featured === "true") {
      query.isFeatured = true;
    }

    if (breaking === "true") {
      query.isBreaking = true;
    }

    if (author) {
      query["author.name"] = { $regex: author, $options: "i" };
    }

    if (idol) {
      query.relatedIdols = idol;
    }

    if (genre) {
      query.relatedGenres = genre;
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
    const [articles, total] = await Promise.all([
      News.find(query)
        .populate("relatedIdols", "name stageName slug profileImage")
        .populate("relatedGenres", "name slug color")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      News.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: articles,
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
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    // Validate required fields
    const { title, content, author } = body;
    if (!title || !content || !author?.name) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: title, content, author.name" },
        { status: 400 }
      );
    }

    // Create news article
    const article = await News.create(body);

    // Update genre and idol counters
    if (article.relatedGenres && article.relatedGenres.length > 0) {
      await Genre.updateMany(
        { _id: { $in: article.relatedGenres } },
        { $inc: { "contentCounts.news": 1 } }
      );
    }

    // Populate the created article
    const populatedArticle = await News.findById(article._id)
      .populate("relatedIdols", "name stageName slug profileImage")
      .populate("relatedGenres", "name slug color");

    return NextResponse.json({
      success: true,
      data: populatedArticle,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating news:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "A news article with this slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create news article" },
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
        { success: false, error: "News article ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Get the current article to compare genres
    const currentArticle = await News.findById(id);
    if (!currentArticle) {
      return NextResponse.json(
        { success: false, error: "News article not found" },
        { status: 404 }
      );
    }

    // Update article
    const updatedArticle = await News.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    )
      .populate("relatedIdols", "name stageName slug profileImage")
      .populate("relatedGenres", "name slug color");

    if (!updatedArticle) {
      return NextResponse.json(
        { success: false, error: "News article not found" },
        { status: 404 }
      );
    }

    // Update genre counts if genres changed
    const oldGenres = currentArticle.relatedGenres?.map(g => g.toString()) || [];
    const newGenres = updatedArticle.relatedGenres?.map(g => g._id.toString()) || [];

    const addedGenres = newGenres.filter(g => !oldGenres.includes(g));
    const removedGenres = oldGenres.filter(g => !newGenres.includes(g));

    await Promise.all([
      Genre.updateMany(
        { _id: { $in: addedGenres } },
        { $inc: { "contentCounts.news": 1 } }
      ),
      Genre.updateMany(
        { _id: { $in: removedGenres } },
        { $inc: { "contentCounts.news": -1 } }
      ),
    ]);

    return NextResponse.json({
      success: true,
      data: updatedArticle,
    });
  } catch (error) {
    console.error("Error updating news:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "A news article with this slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update news article" },
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
        { success: false, error: "News article IDs are required" },
        { status: 400 }
      );
    }

    const articleIds = ids.split(",");

    // Get articles before deletion to update genre counters
    const articles = await News.find({ _id: { $in: articleIds } });

    // Delete articles
    const result = await News.deleteMany({ _id: { $in: articleIds } });

    // Update genre counters
    const genreUpdates = new Map();

    articles.forEach(article => {
      if (article.relatedGenres && article.relatedGenres.length > 0) {
        article.relatedGenres.forEach(genreId => {
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
        Genre.findByIdAndUpdate(genreId, { $inc: { "contentCounts.news": -count } })
      )
    );

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} news articles deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting news:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete news articles" },
      { status: 500 }
    );
  }
}
