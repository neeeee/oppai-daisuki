import { notFound } from "next/navigation";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import PhotoGrid from "@/components/photo/PhotoGrid";

export default async function GalleryPage({
  params,
}: {
  params: { id: string };
}) {
  const client = await clientPromise;
  const db = client.db("photo-gallery");

  const gallery = await db.collection("galleries").findOne({
    _id: new ObjectId(params.id),
  });

  if (!gallery) {
    notFound();
  }

  const photos = await db
    .collection("photos")
    .find({ galleryId: new ObjectId(params.id) })
    .sort({ order: 1, uploadedAt: -1 })
    .toArray();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{gallery.title}</h1>
        {gallery.description && (
          <p className="text-gray-600">{gallery.description}</p>
        )}
        <p className="text-sm text-gray-500 mt-2">{photos.length} photos</p>
      </div>

      <PhotoGrid photos={photos} />
    </div>
  );
}
