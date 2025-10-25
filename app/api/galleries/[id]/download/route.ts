import { NextRequest, NextResponse } from "next/server";
import Gallery from "../../../../models/Gallery";
import Photo from "../../../../models/Photo";
import dbConnect from "../../../../lib/mongodb";
import JSZip from "jszip";
import { auth } from "../../../../lib/auth";
import logger from "@/lib/utils/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();

    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Gallery ID is required" },
        { status: 400 },
      );
    }

    // Find the gallery by ObjectId or slug
    let gallery;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      gallery = await Gallery.findById(id).lean().exec();
    } else {
      gallery = await Gallery.findOne({ slug: id }).lean().exec();
    }

    if (!gallery) {
      return NextResponse.json(
        { success: false, message: "Gallery not found" },
        { status: 404 },
      );
    }

    // Get all photos in this gallery
    const photos = await Photo.find({
      gallery: gallery._id,
      isPublic: true,
    })
      .select("_id title imageUrl thumbnailUrl altText")
      .sort({ createdAt: 1 })
      .lean()
      .exec();

    if (photos.length === 0) {
      return NextResponse.json(
        { success: false, message: "No photos found in this gallery" },
        { status: 404 },
      );
    }

    // Create ZIP file
    const zip = new JSZip();
    const galleryFolder = zip.folder(gallery.title || `gallery-${gallery._id}`);

    // Track successful and failed downloads
    const downloadPromises = photos.map(async (photo, index) => {
      try {
        const response = await fetch(photo.imageUrl);
        if (!response.ok) {
          logger.warn(`Failed to download image: ${photo.imageUrl}`);
          return null;
        }

        const arrayBuffer = await response.arrayBuffer();
        const fileName = photo.title
          ? `${String(index + 1).padStart(3, "0")}-${photo.title.replace(/[^\w\-_.]/g, "_")}.jpg`
          : `${String(index + 1).padStart(3, "0")}-image.jpg`;

        galleryFolder?.file(fileName, arrayBuffer);
        return fileName;
      } catch (error) {
        logger.error(`Error downloading image ${photo.imageUrl}:`, error);
        return null;
      }
    });

    // Wait for all downloads to complete
    const results = await Promise.all(downloadPromises);
    const successfulDownloads = results.filter((result) => result !== null);

    if (successfulDownloads.length === 0) {
      return NextResponse.json(
        { success: false, message: "Failed to download any images" },
        { status: 500 },
      );
    }

    // Add a text file with gallery info
    const infoContent = `Gallery: ${gallery.title || "Untitled Gallery"}
Description: ${gallery.description || "No description"}
Total Photos: ${photos.length}
Successfully Downloaded: ${successfulDownloads.length}
Created: ${gallery.createdAt ? new Date(gallery.createdAt).toLocaleDateString() : "Unknown"}

Photos in this gallery:
${photos.map((photo, index) => `${index + 1}. ${photo.title || "Untitled"}`).join("\n")}
`;

    galleryFolder?.file("gallery-info.txt", infoContent);

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({ type: "uint8array" });

    // Increment download count
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      await Gallery.findByIdAndUpdate(id, {
        $inc: { downloadCount: 1 },
      }).exec();
    } else {
      await Gallery.findOneAndUpdate(
        { slug: id },
        { $inc: { downloadCount: 1 } },
      ).exec();
    }

    // Return ZIP file
    const fileName = `${gallery.title || `gallery-${gallery._id}`}.zip`.replace(
      /[^\w\-_.]/g,
      "_",
    );

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    logger.error("Error creating gallery archive:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create gallery download" },
      { status: 500 },
    );
  }
}
