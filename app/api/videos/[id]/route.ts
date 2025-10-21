import dbConnect from "../../../lib/mongodb";
import Video from "../../../models/Video";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await dbConnect();
    const video = await Video.findById(params.id);
    if (!video) {
      return NextResponse.json({ success: false }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: video });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await dbConnect();
    const body = await request.json();
    const video = await Video.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!video) {
      return NextResponse.json({ success: false }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: video });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await dbConnect();
    const deletedVideo = await Video.deleteOne({ _id: params.id });
    if (!deletedVideo.deletedCount) {
      return NextResponse.json({ success: false }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
