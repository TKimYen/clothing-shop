import path from "node:path";

/**
 * Product images uploaded from the admin form. They live outside `public/`
 * because Next only serves files that existed in `public/` at build time;
 * `GET /api/uploads/products/[name]` streams them back instead.
 */
export const PRODUCT_UPLOAD_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "uploads", "products");
export const PRODUCT_UPLOAD_URL = "/api/uploads/products";
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/** Stored names are `<uuid>.<ext>`; anything else is rejected (no path traversal). */
export const STORED_NAME = /^[0-9a-f-]{36}\.(jpg|png|webp|gif|avif)$/;

export function contentTypeOf(name: string): string {
  const ext = name.slice(name.lastIndexOf(".") + 1);
  return Object.keys(IMAGE_TYPES).find((type) => IMAGE_TYPES[type] === ext) ?? "application/octet-stream";
}
