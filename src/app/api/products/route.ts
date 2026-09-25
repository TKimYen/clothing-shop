import { apiError, apiSuccess } from "@/src/lib/api-response";
import { prisma } from "@/src/lib/db";

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;
const SORT_VALUES = ["newest", "price_asc", "price_desc", "name_asc"] as const;

type SortValue = (typeof SORT_VALUES)[number];

function parseNumber(value: string | null, field: string) {
  if (value === null || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${field} must be a non-negative number`);
  }

  return parsed;
}

function getFilterValue(
  searchParams: URLSearchParams,
  ...keys: string[]
) {
  for (const key of keys) {
    const value = searchParams.get(key)?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = getFilterValue(searchParams, "search", "q");
    const category = getFilterValue(searchParams, "category", "categoryId");
    const collection = getFilterValue(
      searchParams,
      "collection",
      "collectionId",
    );
    const minPrice = parseNumber(searchParams.get("minPrice"), "minPrice");
    const maxPrice = parseNumber(searchParams.get("maxPrice"), "maxPrice");
    const page = parseNumber(searchParams.get("page"), "page") ?? 1;
    const requestedLimit =
      parseNumber(searchParams.get("limit"), "limit") ?? DEFAULT_PAGE_SIZE;
    const sort = (searchParams.get("sort") ?? "newest") as SortValue;

    if (!Number.isInteger(page) || page < 1) {
      throw new Error("page must be a positive integer");
    }
    if (
      !Number.isInteger(requestedLimit) ||
      requestedLimit < 1 ||
      requestedLimit > MAX_PAGE_SIZE
    ) {
      throw new Error(`limit must be an integer between 1 and ${MAX_PAGE_SIZE}`);
    }
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      throw new Error("minPrice must be less than or equal to maxPrice");
    }
    if (!SORT_VALUES.includes(sort)) {
      throw new Error(`sort must be one of: ${SORT_VALUES.join(", ")}`);
    }

    const priceFilter =
      minPrice !== undefined || maxPrice !== undefined
        ? {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
          }
        : undefined;

    const where = {
      isActive: true,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              {
                description: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
      ...(priceFilter ? { price: priceFilter } : {}),
      ...(category
        ? {
            category: {
              OR: [{ id: category }, { slug: category }],
            },
          }
        : {}),
      ...(collection
        ? {
            collection: {
              OR: [{ id: collection }, { slug: collection }],
            },
          }
        : {}),
    };

    const orderBy =
      sort === "price_asc"
        ? { price: "asc" as const }
        : sort === "price_desc"
          ? { price: "desc" as const }
          : sort === "name_asc"
            ? { name: "asc" as const }
            : { createdAt: "desc" as const };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * requestedLimit,
        take: requestedLimit,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          salePrice: true,
          saleStartsAt: true,
          saleEndsAt: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          collection: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
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
      }),
      prisma.product.count({ where }),
    ]);

    return apiSuccess(
      products.map((product) => ({
        ...product,
        price: Number(product.price),
        salePrice:
          product.salePrice === null ? null : Number(product.salePrice),
      })),
      {
        page,
        limit: requestedLimit,
        total,
        totalPages: Math.ceil(total / requestedLimit),
        sort,
      },
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("must")) {
      return apiError(error.message, 400);
    }
    if (
      error instanceof Error &&
      error.message.startsWith("sort must be")
    ) {
      return apiError(error.message, 400);
    }
    console.error("Failed to load products", error);
    return apiError("Unable to load products", 500);
  }
}
