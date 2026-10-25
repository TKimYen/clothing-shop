import { prisma } from "@/src/lib/db";
import { adminHandler } from "@/src/lib/admin/server";

const PERIODS = [7, 30, 90] as const;
type Period = (typeof PERIODS)[number];

export type StatisticsSummary = {
  period: Period;
  totals: {
    revenue: number;
    orders: number;
    customers: number;
    unitsSold: number;
    averageOrderValue: number;
  };
  daily: Array<{ date: string; revenue: number; orders: number }>;
  topProducts: Array<{ name: string; units: number; revenue: number }>;
};

function getPeriod(request: Request): Period {
  const value = Number(new URL(request.url).searchParams.get("period") ?? 30);
  if (!PERIODS.includes(value as Period)) return 30;
  return value as Period;
}

export const GET = adminHandler(async (_request, request: Request): Promise<StatisticsSummary> => {
  const period = getPeriod(request);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - period + 1);

  const [orders, customers] = await Promise.all([
    prisma.order.findMany({
      where: {
        createdAt: { gte: start },
        status: { not: "CANCELLED" },
      },
      orderBy: { createdAt: "asc" },
      select: {
        createdAt: true,
        totalAmount: true,
        items: {
          select: {
            productName: true,
            quantity: true,
            unitPrice: true,
          },
        },
      },
    }),
    prisma.user.count({ where: { createdAt: { gte: start } } }),
  ]);

  const daily = new Map<string, { revenue: number; orders: number }>();
  for (let index = 0; index < period; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    daily.set(date.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
  }

  const productTotals = new Map<string, { units: number; revenue: number }>();
  let revenue = 0;
  let unitsSold = 0;

  for (const order of orders) {
    const orderRevenue = Number(order.totalAmount);
    revenue += orderRevenue;
    const dateKey = order.createdAt.toISOString().slice(0, 10);
    const day = daily.get(dateKey);
    if (day) {
      day.revenue += orderRevenue;
      day.orders += 1;
    }

    for (const item of order.items) {
      const current = productTotals.get(item.productName) ?? { units: 0, revenue: 0 };
      current.units += item.quantity;
      current.revenue += Number(item.unitPrice) * item.quantity;
      productTotals.set(item.productName, current);
      unitsSold += item.quantity;
    }
  }

  return {
    period,
    totals: {
      revenue,
      orders: orders.length,
      customers,
      unitsSold,
      averageOrderValue: orders.length ? revenue / orders.length : 0,
    },
    daily: Array.from(daily, ([date, values]) => ({ date, ...values })),
    topProducts: Array.from(productTotals, ([name, values]) => ({ name, ...values }))
      .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
      .slice(0, 8),
  };
});
