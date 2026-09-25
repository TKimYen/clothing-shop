import { apiError, apiSuccess } from "@/src/lib/api-response";
import { prisma } from "@/src/lib/db";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            products: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    return apiSuccess(
      categories.map(({ _count, ...category }) => ({
        ...category,
        productCount: _count.products,
      })),
    );
  } catch (error) {
    console.error("Failed to load categories", error);
    return apiError("Unable to load categories", 500);
  }
}
