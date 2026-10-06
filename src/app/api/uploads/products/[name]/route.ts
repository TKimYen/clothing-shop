import { readFile } from "node:fs/promises";
import path from "node:path";
import { PRODUCT_UPLOAD_DIR, STORED_NAME, contentTypeOf } from "@/src/lib/admin/uploads";

/** GET /api/uploads/products/:name  serves an image uploaded through the admin form. */
export async function GET(_request: Request, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  if (!STORED_NAME.test(name)) return new Response("Not found", { status: 404 });

  try {
    const data = await readFile(path.join(PRODUCT_UPLOAD_DIR, name));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": contentTypeOf(name),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
