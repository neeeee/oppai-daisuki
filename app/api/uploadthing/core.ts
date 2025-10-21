import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  videoUploader: f({
    video: { maxFileSize: "512MB", maxFileCount: 1 },
  }).onUploadComplete(async ({ metadata, file }) => {
    console.log("Upload complete for userId:", metadata);
    console.log("file url", file.url);
    return { uploadedBy: "admin" };
  }),

  imageUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  }).onUploadComplete(async ({ metadata, file }) => {
    console.log("Upload complete for userId:", metadata);
    console.log("file url", file.url);
    return { uploadedBy: "admin" };
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
