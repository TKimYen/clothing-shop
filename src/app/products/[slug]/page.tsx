import { notFound } from "next/navigation";
import { findProductDetail } from "@/src/lib/product-detail";
import ProductDetailClient from "./ProductDetailClient";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await findProductDetail(slug);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}