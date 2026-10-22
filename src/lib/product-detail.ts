import { prisma } from "@/src/lib/db";
import { getActiveSalePrice } from "@/src/lib/pricing";

export async function findProductDetail(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      salePrice: true,
      saleStartsAt: true,
      saleEndsAt: true,
      images: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          url: true,
          altText: true,
          sortOrder: true,
          colorId: true,
        },
      },
      variants: {
        orderBy: { size: { sortOrder: "asc" } },
        select: {
          id: true,
          sku: true,
          stockQuantity: true,
          size: {
            select: {
              id: true,
              label: true,
              sortOrder: true,
            },
          },
          color: {
            select: {
              id: true,
              name: true,
              hexCode: true,
            },
          },
        },
      },
    },
  });

  if (!product) {
    return null;
  }

  const { saleStartsAt, saleEndsAt, ...rest } = product;

  return {
    ...rest,
    price: Number(product.price),
    salePrice: getActiveSalePrice({ ...product, saleStartsAt, saleEndsAt }),
  };
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof findProductDetail>>>;