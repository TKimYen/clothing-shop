import { apiError, apiSuccess } from "@/src/lib/api-response";
import { findProductDetail } from "@/src/lib/product-detail";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const product = await findProductDetail(slug);

  if (!product) {
    return apiError("Không tìm thấy sản phẩm", 404);
  }

  return apiSuccess(product);
}