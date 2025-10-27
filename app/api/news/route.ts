import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import News from "@/models/News";

import Genre from "@/models/Genre";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";
import { isOriginAllowed } from "@/lib/utils/origin-validation";
import { AdminUser } from "@/lib/types";
import logger from "@/lib/utils/logger";

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
    const includeUnpublishedQuery =
      searchParams.get("includeUnpublished") === "true";
    let includeUnpublished = false;
    try {
      const session = await auth();
      includeUnpublished = !!(
        includeUnpublishedQuery && session?.user?.role === "admin"
      );
    } catch {
      includeUnpublished = false;
    }

    // Build query
    const query: Record<string, unknown> = {};

    if (!includeUnpublished) {
      query.status = "published";
      query.isPublic = true;
      query.$or = [
        { publishedAt: { $lte: new Date() } },
        { publishedAt: { $exists: false } },
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
      const tagArray = tags.split(",").map((tag) => tag.trim());
      query.tags = { $in: tagArray };
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query without population for now
    const [articles, total] = await Promise.all([
      News.find(query).sort(sort).skip(skip).limit(limit).lean(),
      News.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: articles.map(
        (a: Record<string, unknown> & { content?: string }) => {
          const content = String(a?.content ?? "");
          // Strip obvious dangerous patterns (script tags, event handlers, javascript: URLs)
          const sanitized = content
            .replace(/<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, "")
            .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, "")
            .replace(
              /(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi,
              '$1="#"',
            );
          return { ...a, content: sanitized };
        },
      ),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error("Error fetching news:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch news" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const session = await auth();
    if (!session || (session.user as AdminUser)?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    console.log("[API] Starting request processing...");

    const origin = request.headers.get("origin");
    const originAllowed = isOriginAllowed(origin, request.url);
    if (!originAllowed) {
      console.log(`[API] Rejecting request due to origin validation`);
      return NextResponse.json(
        { success: false, error: "Bad origin" },
        { status: 403 },
      );
    }

    console.log("[API] Origin validation passed, continuing...");
    const body = await request.json();

    // Validate required fields
    const { title, content, author } = body;
    if (!title || !content || !author?.name) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: title, content, author.name",
        },
        { status: 400 },
      );
    }

    // Create news article
    const article = await News.create(body);

    // Update genre and idol counters
    if (article.relatedGenres && article.relatedGenres.length > 0) {
      await Genre.updateMany(
        { _id: { $in: article.relatedGenres } },
        { $inc: { "contentCounts.news": 1 } },
      );
    }

    // Return the created article without population for now
    const populatedArticle = await News.findById(article._id);

    return NextResponse.json(
      {
        success: true,
        data: populatedArticle,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const err = error as { name?: string; code?: number; errors?: unknown };

    if (err?.name === "ValidationError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.errors },
        { status: 400 },
      );
    }

    if (err?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "A news article with this slug already exists",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create news article" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const session = await auth();
    if (!session || (session.user as AdminUser)?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const origin = request.headers.get("origin");
    console.log(`[PUT API] Origin: ${origin}`);

    if (!isOriginAllowed(origin, request.url)) {
      console.log(`[PUT API] Origin validation failed for: ${origin}`);
      return NextResponse.json(
        { success: false, error: "Bad origin" },
        { status: 403 },
      );
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "News article ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();

    // Get the current article to compare genres
    const currentArticle = await News.findById(id);
    if (!currentArticle) {
      return NextResponse.json(
        { success: false, error: "News article not found" },
        { status: 404 },
      );
    }

    // Update article without population for now
    const updatedArticle = await News.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedArticle) {
      return NextResponse.json(
        { success: false, error: "News article not found" },
        { status: 404 },
      );
    }

    // Update genre counts if genres changed
    const oldGenres =
      currentArticle.relatedGenres?.map((g: mongoose.Types.ObjectId) =>
        g.toString(),
      ) || [];
    const newGenres =
      updatedArticle.relatedGenres?.map((g: { _id: mongoose.Types.ObjectId }) =>
        g._id.toString(),
      ) || [];

    const addedGenres = newGenres.filter((g: string) => !oldGenres.includes(g));
    const removedGenres = oldGenres.filter(
      (g: string) => !newGenres.includes(g),
    );

    await Promise.all([
      Genre.updateMany(
        { _id: { $in: addedGenres } },
        { $inc: { "contentCounts.news": 1 } },
      ),
      Genre.updateMany(
        { _id: { $in: removedGenres } },
        { $inc: { "contentCounts.news": -1 } },
      ),
    ]);

    return NextResponse.json({
      success: true,
      data: updatedArticle,
    });
  } catch (error: unknown) {
    const err = error as { name?: string; code?: number; errors?: unknown };
    logger.error("Error updating news:", err);

    if (err?.name === "ValidationError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.errors },
        { status: 400 },
      );
    }

    if (err?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "A news article with this slug already exists",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update news article" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const session = await auth();
    if (!session || (session.user as AdminUser)?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const origin = request.headers.get("origin");
    console.log(`[DELETE API] Origin: ${origin}`);

    if (!isOriginAllowed(origin, request.url)) {
      console.log(`[DELETE API] Origin validation failed for: ${origin}`);
      return NextResponse.json(
        { success: false, error: "Bad origin" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const ids = searchParams.get("ids");

    if (!ids) {
      return NextResponse.json(
        { success: false, error: "News article IDs are required" },
        { status: 400 },
      );
    }

    const articleIds = ids.split(",");

    // Get articles before deletion to update genre counters
    const articles = await News.find({ _id: { $in: articleIds } });

    // Delete articles
    const result = await News.deleteMany({ _id: { $in: articleIds } });

    // Update genre counters
    const genreUpdates = new Map<string, number>();

    articles.forEach((article) => {
      if (article.relatedGenres && article.relatedGenres.length > 0) {
        article.relatedGenres.forEach((genreId: mongoose.Types.ObjectId) => {
          const genreIdStr = genreId.toString();
          genreUpdates.set(genreIdStr, (genreUpdates.get(genreIdStr) || 0) + 1);
        });
      }
    });

    // Update genre counters
    await Promise.all(
      Array.from(genreUpdates.entries()).map(
        ([genreId, count]: [string, number]) =>
          Genre.findByIdAndUpdate(genreId, {
            $inc: { "contentCounts.news": -count },
          }),
      ),
    );

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} news articles deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error("Error deleting news:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete news articles" },
      { status: 500 },
    );
  }
}
