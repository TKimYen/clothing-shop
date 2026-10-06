import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { adminHandler, badRequest } from "@/src/lib/admin/server";
import {
  IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  PRODUCT_UPLOAD_DIR,
  PRODUCT_UPLOAD_URL,
} from "@/src/lib/admin/uploads";

/** POST /api/admin/uploads  multipart/form-data `file` -> `{ url }` */
export const POST = adminHandler(async (request) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw badRequest("Expected multipart/form-data");
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) throw badRequest("No image file uploaded");

  const ext = IMAGE_TYPES[file.type];
  if (!ext) throw badRequest("Only JPG, PNG, WEBP, GIF or AVIF images are allowed");
  if (file.size > MAX_UPLOAD_BYTES) throw badRequest("Image must be 5 MB or smaller");

  const name = `${randomUUID()}.${ext}`;
  await mkdir(PRODUCT_UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(PRODUCT_UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));

  return { url: `${PRODUCT_UPLOAD_URL}/${name}` };
});
