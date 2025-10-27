import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import News from "@/models/News";
import logger from "@/lib/utils/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "News ID is required" },
        { status: 400 },
      );
    }

    // Find the news article by ObjectId or slug
    let news;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // It's a valid ObjectId
      news = await News.findById(id)
        .populate("relatedIdols", "name stageName avatar")
        .populate("relatedGenres", "name description")
        .lean();
    } else {
      // It's a slug
      news = await News.findOne({ slug: id })
        .populate("relatedIdols", "name stageName avatar")
        .populate("relatedGenres", "name description")
        .lean();
    }

    if (!news) {
      return NextResponse.json(
        { success: false, message: "News article not found" },
        { status: 404 },
      );
    }

    // Check if article is published and public
    if (
      (news as unknown as { status: string; isPublic: boolean }).status !==
        "published" ||
      !(news as unknown as { status: string; isPublic: boolean }).isPublic
    ) {
      return NextResponse.json(
        { success: false, message: "Article not available" },
        { status: 404 },
      );
    }

    // Check if article is scheduled for future publication
    if (
      (news as unknown as { scheduledAt?: string }).scheduledAt &&
      new Date((news as unknown as { scheduledAt?: string }).scheduledAt!) >
        new Date()
    ) {
      return NextResponse.json(
        { success: false, message: "Article not yet available" },
        { status: 404 },
      );
    }

    const sanitizedContent = String(
      (news as unknown as { content?: string })?.content || "",
    )
      .replace(/<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, "")
      .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, "")
      .replace(/(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi, '$1="#"');
    return NextResponse.json({
      success: true,
      data: { ...news, content: sanitizedContent },
    });
  } catch (error) {
    logger.error("Error fetching article:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch news article" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();

    const { id } = await params;
    const { action } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "News ID is required" },
        { status: 400 },
      );
    }

    let news;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      news = await News.findById(id);
    } else {
      news = await News.findOne({ slug: id });
    }
    if (!news) {
      return NextResponse.json(
        { success: false, message: "News article not found" },
        { status: 404 },
      );
    }

    switch (action) {
      case "view":
        // Increment view count
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
          await News.findByIdAndUpdate(id, {
            $inc: { "engagement.viewCount": 1 },
          });
        } else {
          await News.findOneAndUpdate(
            { slug: id },
            { $inc: { "engagement.viewCount": 1 } },
          );
        }
        return NextResponse.json({
          success: true,
          message: "View count incremented",
        });

      case "like":
        // Increment like count
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
          await News.findByIdAndUpdate(id, {
            $inc: { "engagement.likeCount": 1 },
          });
        } else {
          await News.findOneAndUpdate(
            { slug: id },
            { $inc: { "engagement.likeCount": 1 } },
          );
        }
        return NextResponse.json({
          success: true,
          message: "Like count incremented",
        });

      case "share":
        // Increment share count
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
          await News.findByIdAndUpdate(id, {
            $inc: { "engagement.shareCount": 1 },
          });
        } else {
          await News.findOneAndUpdate(
            { slug: id },
            { $inc: { "engagement.shareCount": 1 } },
          );
        }
        return NextResponse.json({
          success: true,
          message: "Share count incremented",
        });

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 },
        );
    }
  } catch (error) {
    logger.error("Error updating article:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update news article" },
      { status: 500 },
    );
  }
}
