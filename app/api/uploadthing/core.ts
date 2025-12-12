import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  videoUploader: f({
    video: { maxFileSize: "8GB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session || session.user?.role !== "admin") {
        throw new UploadThingError("Unauthorized");
      }
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      return { uploadedBy: "admin" };
    }),

  imageUploader: f({
    image: { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session || session.user?.role !== "admin") {
        throw new UploadThingError("Unauthorized");
      }
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      return { uploadedBy: "admin" };
    }),
  albumUploader: f({
    image: { maxFileSize: "16MB", maxFileCount: 300 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session || session.user?.role !== "admin") {
        throw new UploadThingError("Unauthorized");
      }
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      return { uploadedBy: "admin" };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
