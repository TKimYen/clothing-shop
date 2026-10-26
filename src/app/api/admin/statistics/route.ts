import { prisma } from "@/src/lib/db";
import { adminHandler, badRequest } from "@/src/lib/admin/server";
import {
  REPORT_TIME_ZONE,
  addReportDays,
  parseReportDate,
  reportDayCount,
  reportDayLabel,
  reportDayStart,
  todayReportDate,
} from "@/src/lib/utils";
import type {
  OrderStatus,
  StatisticsPeriod,
  StatisticsSummary,
  StatisticsTopProduct,
  StatisticsTotals,
} from "@/src/types";
import { ORDER_STATUSES } from "@/src/types";

const PERIODS: readonly StatisticsPeriod[] = [7, 30, 90];
const MAX_REPORT_DAYS = 366;
const TOP_PRODUCT_LIMIT = 8;

type ResolvedRange = { from: string; to: string; days: number };

type DailyRow = {
  date: string;
  revenue: number;
  orders: number;
  unitsSold: number;
};

type StatusRow = {
  status: OrderStatus;
  orders: number;
  value: number;
  discount: number;
  shipping: number;
};

type TopProductRow = {
  productId: string;
  name: string;
  thumbnail: string | null;
  units: number;
  revenue: number;
};

function periodRange(period: StatisticsPeriod): ResolvedRange {
  const to = todayReportDate();
  return { from: addReportDays(to, -(period - 1)), to, days: period };
}

function resolveRange(request: Request): ResolvedRange {
  const params = new URL(request.url).searchParams;
  const fromParam = params.get("from");
  const toParam = params.get("to");

  if (fromParam !== null || toParam !== null) {
    if (!fromParam || !toParam) {
      throw badRequest("Both from and to are required", {
        from: "Required",
        to: "Required",
      });
    }

    const from = parseReportDate(fromParam);
    const to = parseReportDate(toParam);
    if (!from) throw badRequest("Invalid from date", { from: "Use YYYY-MM-DD" });
    if (!to) throw badRequest("Invalid to date", { to: "Use YYYY-MM-DD" });
    if (from > to) throw badRequest("from must be on or before to", { from: "Must be before to" });

    const days = reportDayCount(from, to);
    if (days > MAX_REPORT_DAYS) {
      throw badRequest(`Date range cannot exceed ${MAX_REPORT_DAYS} days`, {
        to: `Maximum ${MAX_REPORT_DAYS} days`,
      });
    }
    return { from, to, days };
  }

  const rawPeriod = params.get("period");
  if (rawPeriod === null) return periodRange(30);

  const period = Number(rawPeriod);
  if (!PERIODS.includes(period as StatisticsPeriod)) {
    throw badRequest("Invalid period", { period: "Use 7, 30 or 90" });
  }
  return periodRange(period as StatisticsPeriod);
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function emptyTotals(): StatisticsTotals {
  return {
    revenue: 0,
    orders: 0,
    customers: 0,
    unitsSold: 0,
    averageOrderValue: 0,
    discountTotal: 0,
    shippingTotal: 0,
  };
}

function dailyStats(start: Date, end: Date, range: ResolvedRange) {
  return prisma.$queryRaw<DailyRow[]>`
    WITH days AS (
      SELECT generate_series(${range.from}::date, ${range.to}::date, interval '1 day')::date AS day
    ),
    scoped AS (
      SELECT id, status, total_amount, created_at
      FROM orders
      WHERE created_at >= ${start} AND created_at < ${end}
    ),
    day_orders AS (
      SELECT (created_at + interval '7 hours')::date AS day,
             COUNT(*) FILTER (WHERE status::text <> 'CANCELLED')::int AS orders,
             COALESCE(SUM(total_amount) FILTER (WHERE status::text <> 'CANCELLED'), 0)::float8 AS revenue
      FROM scoped
      GROUP BY 1
    ),
    day_units AS (
      SELECT (o.created_at + interval '7 hours')::date AS day,
             COALESCE(SUM(oi.quantity), 0)::int AS units
      FROM scoped o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE o.status::text <> 'CANCELLED'
      GROUP BY 1
    )
    SELECT to_char(d.day, 'YYYY-MM-DD') AS date,
           COALESCE(o.orders, 0)::int AS orders,
           COALESCE(o.revenue, 0)::float8 AS revenue,
           COALESCE(u.units, 0)::int AS "unitsSold"
    FROM days d
    LEFT JOIN day_orders o ON o.day = d.day
    LEFT JOIN day_units u ON u.day = d.day
    ORDER BY d.day
  `;
}

function statusStats(start: Date, end: Date) {
  return prisma.$queryRaw<StatusRow[]>`
    SELECT status::text AS status,
           COUNT(*)::int AS orders,
           COALESCE(SUM(total_amount), 0)::float8 AS value,
           COALESCE(SUM(discount_amount), 0)::float8 AS discount,
           COALESCE(SUM(shipping_fee), 0)::float8 AS shipping
    FROM orders
    WHERE created_at >= ${start} AND created_at < ${end}
    GROUP BY status
  `;
}

function topProductStats(start: Date, end: Date) {
  return prisma.$queryRaw<TopProductRow[]>`
    SELECT pv.product_id AS "productId",
           COALESCE(p.name, MIN(oi.product_name)) AS name,
           img.url AS thumbnail,
           SUM(oi.quantity)::int AS units,
           SUM(oi.unit_price * oi.quantity)::float8 AS revenue
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN product_variants pv ON pv.id = oi.variant_id
    LEFT JOIN products p ON p.id = pv.product_id
    LEFT JOIN LATERAL (
      SELECT url
      FROM product_images
      WHERE product_id = pv.product_id
      ORDER BY sort_order ASC
      LIMIT 1
    ) img ON true
    WHERE o.created_at >= ${start} AND o.created_at < ${end}
      AND o.status::text <> 'CANCELLED'
    GROUP BY pv.product_id, p.name, img.url
    ORDER BY units DESC, revenue DESC, name ASC
    LIMIT ${TOP_PRODUCT_LIMIT}
  `;
}

/**
 * GET /api/admin/statistics
 *   ?period=7|30|90
 *   ?from=YYYY-MM-DD&to=YYYY-MM-DD   (custom range, max 366 days)
 *
 * Revenue follows the shop rule: every non-cancelled order, regardless of
 * payment status. Days are grouped by the Asia/Ho_Chi_Minh calendar.
 */
export const GET = adminHandler(async (request): Promise<StatisticsSummary> => {
  const range = resolveRange(request);

  const previousTo = addReportDays(range.from, -1);
  const previousFrom = addReportDays(previousTo, -(range.days - 1));

  const start = reportDayStart(range.from);
  const end = reportDayStart(addReportDays(range.to, 1));
  const previousStart = reportDayStart(previousFrom);
  const previousEnd = reportDayStart(addReportDays(previousTo, 1));

  const [
    dailyRows,
    statusRows,
    topProductRows,
    customers,
    previousOrderStats,
    previousCustomers,
    previousUnitStats,
  ] = await Promise.all([
    dailyStats(start, end, range),
    statusStats(start, end),
    topProductStats(start, end),
    prisma.user.count({
      where: {
        role: "CUSTOMER",
        createdAt: { gte: start, lt: end },
      },
    }),
    prisma.order.aggregate({
      where: {
        createdAt: { gte: previousStart, lt: previousEnd },
        status: { not: "CANCELLED" },
      },
      _count: { _all: true },
      _sum: { totalAmount: true, discountAmount: true, shippingFee: true },
    }),
    prisma.user.count({
      where: {
        role: "CUSTOMER",
        createdAt: { gte: previousStart, lt: previousEnd },
      },
    }),
    prisma.orderItem.aggregate({
      where: {
        order: {
          createdAt: { gte: previousStart, lt: previousEnd },
          status: { not: "CANCELLED" },
        },
      },
      _sum: { quantity: true },
    }),
  ]);

  const daily = dailyRows.map((row) => ({
    date: row.date,
    label: reportDayLabel(row.date),
    revenue: Number(row.revenue),
    orders: row.orders,
    unitsSold: row.unitsSold,
  }));

  const statusByValue = new Map(statusRows.map((row) => [row.status, row]));
  const allOrders = statusRows.reduce((sum, row) => sum + row.orders, 0);

  const totals = emptyTotals();
  totals.customers = customers;
  totals.unitsSold = daily.reduce((sum, row) => sum + row.unitsSold, 0);

  const statusBreakdown = ORDER_STATUSES.map((status) => {
    const row = statusByValue.get(status);
    const orders = row?.orders ?? 0;

    if (status !== "CANCELLED" && row) {
      totals.revenue += Number(row.value);
      totals.orders += row.orders;
      totals.discountTotal += Number(row.discount);
      totals.shippingTotal += Number(row.shipping);
    }

    return {
      status,
      orders,
      value: Number(row?.value ?? 0),
      percent: allOrders ? (orders / allOrders) * 100 : 0,
    };
  });

  totals.averageOrderValue = totals.orders ? totals.revenue / totals.orders : 0;

  const previous = emptyTotals();
  previous.revenue = Number(previousOrderStats._sum.totalAmount ?? 0);
  previous.orders = previousOrderStats._count._all;
  previous.customers = previousCustomers;
  previous.unitsSold = previousUnitStats._sum.quantity ?? 0;
  previous.averageOrderValue = previous.orders ? previous.revenue / previous.orders : 0;
  previous.discountTotal = Number(previousOrderStats._sum.discountAmount ?? 0);
  previous.shippingTotal = Number(previousOrderStats._sum.shippingFee ?? 0);

  const topProducts: StatisticsTopProduct[] = topProductRows.map((row) => ({
    productId: row.productId,
    name: row.name,
    thumbnail: row.thumbnail,
    units: row.units,
    revenue: Number(row.revenue),
  }));

  return {
    range: {
      from: range.from,
      to: range.to,
      days: range.days,
      timeZone: REPORT_TIME_ZONE,
    },
    previousRange: {
      from: previousFrom,
      to: previousTo,
      days: range.days,
      timeZone: REPORT_TIME_ZONE,
    },
    totals,
    previous,
    change: {
      revenue: percentChange(totals.revenue, previous.revenue),
      orders: percentChange(totals.orders, previous.orders),
      customers: percentChange(totals.customers, previous.customers),
      unitsSold: percentChange(totals.unitsSold, previous.unitsSold),
      averageOrderValue: percentChange(totals.averageOrderValue, previous.averageOrderValue),
    },
    daily,
    topProducts,
    statusBreakdown,
    generatedAt: new Date().toISOString(),
  };
});
