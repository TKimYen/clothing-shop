import { apiError, apiSuccess } from "@/src/lib/api-response";
import { prisma } from "@/src/lib/db";

export async function GET() {
  try {
    const collections = await prisma.collection.findMany({
      where: { isActive: true },
      orderBy: [{ startsAt: "desc" }, { year: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        season: true,
        year: true,
        description: true,
        bannerUrl: true,
        startsAt: true,
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
      collections.map(({ _count, ...collection }) => ({
        ...collection,
        productCount: _count.products,
      })),
    );
  } catch (error) {
    console.error("Failed to load collections", error);
    return apiError("Unable to load collections", 500);
  }
}
