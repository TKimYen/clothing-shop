import { prisma } from "@/src/lib/db";
import { mapOrder, orderInclude } from "@/src/lib/admin/mappers";
import { adminHandler } from "@/src/lib/admin/server";
import { LOW_STOCK_THRESHOLD } from "@/src/lib/services/constants";
import type { DashboardSummary } from "@/src/lib/services/dashboardService";
import { ORDER_STATUSES } from "@/src/types";

/** GET /api/admin/dashboard — totals, orders by status, recent orders, low stock. */
export const GET = adminHandler(async (): Promise<DashboardSummary> => {
  const [
    users,
    products,
    categories,
    orders,
    revenue,
    byStatus,
    recent,
    lowStock,
    activeCoupons,
    units,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.category.count(),
    prisma.order.count(),
    prisma.order.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { totalAmount: true },
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.findMany({ include: orderInclude, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.productVariant.findMany({
      where: { stockQuantity: { lt: LOW_STOCK_THRESHOLD } },
      orderBy: [{ stockQuantity: "asc" }, { sku: "asc" }],
      take: 8,
      select: {
        sku: true,
        stockQuantity: true,
        size: { select: { label: true } },
        color: { select: { name: true } },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
          },
        },
      },
    }),
    prisma.coupon.count({ where: { isActive: true } }),
    prisma.productVariant.aggregate({ _sum: { stockQuantity: true } }),
  ]);

  const countByStatus = new Map(byStatus.map((row) => [row.status, row._count._all]));

  return {
    totals: {
      users,
      products,
      categories,
      orders,
      revenue: Number(revenue._sum.totalAmount ?? 0),
    },
    ordersByStatus: ORDER_STATUSES.map((status) => ({
      status,
      count: countByStatus.get(status) ?? 0,
    })),
    recentOrders: recent.map(mapOrder),
    lowStock: lowStock.map((variant) => ({
      productId: variant.product.id,
      productName: variant.product.name,
      slug: variant.product.slug,
      sku: variant.sku,
      sizeLabel: variant.size.label,
      colorName: variant.color.name,
      stockQuantity: variant.stockQuantity,
      thumbnail: variant.product.images[0]?.url ?? null,
    })),
    activeCoupons,
    totalUnits: units._sum.stockQuantity ?? 0,
  };
});
