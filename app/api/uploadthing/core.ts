import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";
import logger from "@/lib/utils/logger";

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
      logger.info("[UPLOAD] video uploaded:", file.ufsUrl);
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
      logger.info("[UPLOAD] image uploaded:", file.ufsUrl);
      return { uploadedBy: "admin" };
    }),
  albumUploader: f({
    image: { maxFileSize: "16MB", maxFileCount: 100 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session || session.user?.role !== "admin") {
        throw new UploadThingError("Unauthorized");
      }
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      logger.info("[UPLOAD] album uploaded:", file.ufsUrl);
      return { uploadedBy: "admin" };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
