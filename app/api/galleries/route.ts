// src/app/api/galleries/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("photo-gallery");

    const galleries = await db
      .collection("galleries")
      .find({ isPublic: true })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(galleries);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch galleries" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("photo-gallery");

    const gallery = {
      ...body,
      slug: body.title.toLowerCase().replace(/\s+/g, "-"),
      createdAt: new Date(),
      updatedAt: new Date(),
      photoCount: 0,
    };

    const result = await db.collection("galleries").insertOne(gallery);
    return NextResponse.json({ id: result.insertedId });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create gallery" },
      { status: 500 },
    );
  }
}
