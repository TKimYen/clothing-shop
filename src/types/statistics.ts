import type { OrderStatus } from "./order";

/** The presets exposed by the statistics page. */
export type StatisticsPeriod = 7 | 30 | 90;

export type StatisticsRange = {
  /** Inclusive `YYYY-MM-DD` in the report timezone. */
  from: string;
  /** Inclusive `YYYY-MM-DD` in the report timezone. */
  to: string;
  days: number;
  /** IANA timezone used to group orders into calendar days. */
  timeZone: string;
};

export type StatisticsTotals = {
  /** Sum of `totalAmount` for every non-cancelled order. */
  revenue: number;
  orders: number;
  /** Accounts created in the range (customers only). */
  customers: number;
  unitsSold: number;
  averageOrderValue: number;
  discountTotal: number;
  shippingTotal: number;
};

/**
 * Percentage change compared with the immediately preceding range.
 * `null` means the previous value was zero and the current value is not,
 * so a percentage would be undefined (the UI renders it as "Mới").
 */
export type StatisticsChange = {
  revenue: number | null;
  orders: number | null;
  customers: number | null;
  unitsSold: number | null;
  averageOrderValue: number | null;
};

export type StatisticsDailyPoint = {
  /** `YYYY-MM-DD` in the report timezone. */
  date: string;
  /** Short display label, e.g. `26/10`. */
  label: string;
  revenue: number;
  orders: number;
  unitsSold: number;
};

export type StatisticsTopProduct = {
  productId: string;
  name: string;
  thumbnail: string | null;
  units: number;
  /** Gross item revenue (`unitPrice * quantity`), before order-level discounts. */
  revenue: number;
};

export type StatisticsStatusRow = {
  status: OrderStatus;
  orders: number;
  /** Sum of order totals for this status (cancelled orders included). */
  value: number;
  /** Share of all orders in the range, 0–100. */
  percent: number;
};

export type StatisticsSummary = {
  range: StatisticsRange;
  previousRange: StatisticsRange;
  totals: StatisticsTotals;
  previous: StatisticsTotals;
  change: StatisticsChange;
  daily: StatisticsDailyPoint[];
  topProducts: StatisticsTopProduct[];
  statusBreakdown: StatisticsStatusRow[];
  generatedAt: string;
};
