import { apiError, apiSuccess } from "@/src/lib/api-response";
import { prisma } from "@/src/lib/db";
import { getActiveSalePrice, getEffectivePrice } from "@/src/lib/pricing";

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

function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase("vi-VN")
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function getSearchScore(
  product: { name: string; description: string | null },
  search: string,
) {
  const normalizedSearch = normalizeSearchText(search);
  if (!normalizedSearch) return 0;

  const normalizedName = normalizeSearchText(product.name);
  const normalizedDescription = normalizeSearchText(product.description ?? "");
  const searchTokens = normalizedSearch.split(" ");
  const nameTokens = new Set(normalizedName.split(" "));
  const descriptionTokens = new Set(normalizedDescription.split(" "));
  const matchedNameTokens = searchTokens.filter((token) => nameTokens.has(token));
  const matchedDescriptionTokens = searchTokens.filter((token) =>
    descriptionTokens.has(token),
  );
  const hasAllNameTokens = matchedNameTokens.length === searchTokens.length;

  return (
    (normalizedName === normalizedSearch ? 100_000 : 0) +
    (normalizedName.includes(normalizedSearch) ? 50_000 : 0) +
    (hasAllNameTokens ? 25_000 : 0) +
    matchedNameTokens.length * 5_000 +
    (normalizedDescription.includes(normalizedSearch) ? 2_000 : 0) +
    matchedDescriptionTokens.length * 500
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = getFilterValue(searchParams, "search", "q");
    const category = getFilterValue(searchParams, "category", "categoryId");
    const color = getFilterValue(searchParams, "color", "colorId");
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

    const priceRange =
      minPrice !== undefined || maxPrice !== undefined
        ? {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
          }
        : undefined;

    // Lọc theo giá thực tế: giá sale nếu đang trong đợt khuyến mãi, ngược lại giá gốc
    const now = new Date();
    const saleIsActive = {
      salePrice: { not: null },
      OR: [{ saleStartsAt: null }, { saleStartsAt: { lte: now } }],
      AND: [{ OR: [{ saleEndsAt: null }, { saleEndsAt: { gte: now } }] }],
    };
    const effectivePriceFilter = priceRange
      ? {
          OR: [
            { AND: [saleIsActive, { salePrice: priceRange }] },
            { NOT: saleIsActive, price: priceRange },
          ],
        }
      : undefined;

    const where = {
      isActive: true,
      ...(effectivePriceFilter ? { AND: [effectivePriceFilter] } : {}),
      ...(category
        ? {
            category: {
              OR: [{ id: category }, { slug: category }],
            },
          }
        : {}),
      ...(color
        ? {
            variants: {
              some: {
                color: {
                  OR: [{ id: color }, { name: color }],
                },
              },
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

    const shouldSortByEffectivePrice = sort === "price_asc" || sort === "price_desc";
    const shouldRankSearchResults = Boolean(search);
    const searchTerm = search ?? "";
    const shouldLoadAllProducts =
      shouldRankSearchResults || shouldSortByEffectivePrice;
    const [allProducts, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: shouldSortByEffectivePrice
          ? { createdAt: "desc" }
          : orderBy,
        ...(shouldLoadAllProducts
          ? {}
          : {
              skip: (page - 1) * requestedLimit,
              take: requestedLimit,
            }),
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          salePrice: true,
          saleStartsAt: true,
          saleEndsAt: true,
          createdAt: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          images: {
            orderBy: { sortOrder: "asc" },
            take: 2,
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
      }),
      prisma.product.count({ where }),
    ]);

    const sortedProducts = shouldRankSearchResults
      ? [...allProducts].sort((a, b) => {
          const scoreDifference =
            getSearchScore(b, searchTerm) - getSearchScore(a, searchTerm);
          if (scoreDifference !== 0) return scoreDifference;

          if (shouldSortByEffectivePrice) {
            const priceDifference =
              getEffectivePrice(a, now) - getEffectivePrice(b, now);
            return sort === "price_asc" ? priceDifference : -priceDifference;
          }

          return 0;
        })
      : shouldSortByEffectivePrice
        ? [...allProducts].sort((a, b) => {
            const aPrice = getEffectivePrice(a, now);
            const bPrice = getEffectivePrice(b, now);
            return sort === "price_asc" ? aPrice - bPrice : bPrice - aPrice;
          })
        : allProducts;
    const products = shouldLoadAllProducts
      ? sortedProducts.slice((page - 1) * requestedLimit, page * requestedLimit)
      : sortedProducts;

    return apiSuccess(
      products.map(({ saleStartsAt, saleEndsAt, createdAt, ...product }) => ({
        ...product,
        badge:
          createdAt.getTime() >= now.getTime() - 1000 * 60 * 60 * 24 * 30
            ? "Mới"
            : "Bán chạy",
        price: Number(product.price),
        salePrice: getActiveSalePrice({
          ...product,
          saleStartsAt,
          saleEndsAt,
        }),
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
