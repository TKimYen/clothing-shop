import type { Order, OrderStatus } from "@/src/types";
import { api } from "./http";

export type LowStockRow = {
  productId: string;
  productName: string;
  slug: string;
  sku: string;
  sizeLabel: string;
  colorName: string;
  stockQuantity: number;
  thumbnail: string | null;
};

export type DashboardSummary = {
  totals: {
    users: number;
    products: number;
    categories: number;
    orders: number;
    /** Cancelled orders are excluded. */
    revenue: number;
  };
  ordersByStatus: Array<{ status: OrderStatus; count: number }>;
  recentOrders: Order[];
  lowStock: LowStockRow[];
  activeCoupons: number;
  totalUnits: number;
};

export const dashboardService = {
  getSummary: () => api.get<DashboardSummary>("/api/admin/dashboard"),

  async getLowStock(): Promise<LowStockRow[]> {
    const summary = await dashboardService.getSummary();
    return summary.lowStock;
  },
};
