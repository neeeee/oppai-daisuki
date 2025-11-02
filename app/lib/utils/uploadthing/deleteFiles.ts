import { UTApi } from "uploadthing/server";
const utapi = new UTApi();

export async function deleteUploadThingFiles(keys: string[] | string) {
  const keyArray = Array.isArray(keys) ? keys : [keys];
  if (keyArray.length === 0) return;
  try {
    await utapi.deleteFiles(keyArray);
    console.log(`🧹 Deleted ${keyArray.length} file(s) from UploadThing`);
  } catch (err) {
    console.error("❌ UploadThing delete failed:", err);
  }
}