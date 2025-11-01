import dbConnect from "@/lib/mongodb";
import Video from "@/models/Video";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AdminUser } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;
    const video = await Video.findById(id)
      .populate("idol", "name slug channelAvatar")
      .populate("genres", "name slug color");

    if (!video) {
      return NextResponse.json({ success: false }, { status: 404 });
    }
    if (!video.isPublic) {
      return NextResponse.json({ success: false }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: video });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();

    // Admin guard
    const session = await auth();
    if (!session || (session.user as AdminUser)?.role !== "admin") {
      return NextResponse.json({ success: false }, { status: 401 });
    }
    // Origin check
    const origin = request.headers.get("origin");
    const baseUrl = process.env.NEXTAUTH_URL || new URL(request.url).origin;
    if (origin && !origin.startsWith(baseUrl)) {
      return NextResponse.json(
        { success: false, error: "Bad origin" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { id } = await params;
    const video = await Video.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!video) {
      return NextResponse.json({ success: false }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: video });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();

    // Admin guard
    const session = await auth();
    if (!session || (session.user as AdminUser)?.role !== "admin") {
      return NextResponse.json({ success: false }, { status: 401 });
    }
    // Origin check
    const origin = request.headers.get("origin");
    const baseUrl = process.env.NEXTAUTH_URL || new URL(request.url).origin;
    if (origin && !origin.startsWith(baseUrl)) {
      return NextResponse.json(
        { success: false, error: "Bad origin" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const deletedVideo = await Video.deleteOne({ _id: id });
    if (!deletedVideo.deletedCount) {
      return NextResponse.json({ success: false }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: {} });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
