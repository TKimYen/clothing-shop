import type { ListParams, ListResult, Order, OrderStatus } from "@/src/types";
import { NotFoundError } from "./errors";
import { api, listQuery } from "./http";

const BASE = "/api/admin/orders";

export const orderService = {
  list: (params: ListParams = {}) => api.get<ListResult<Order>>(`${BASE}${listQuery(params)}`),

  async get(id: string): Promise<Order | null> {
    try {
      return await api.get<Order>(`${BASE}/${encodeURIComponent(id)}`);
    } catch (error) {
      if (error instanceof NotFoundError) return null;
      throw error;
    }
  },

  /**
   * Status is the only mutable field, and only along the documented flow:
   * PENDING -> CONFIRMED -> SHIPPING -> DELIVERED, or -> CANCELLED from any
   * non-terminal state. The API enforces the same rule.
   */
  updateStatus: (id: string, status: OrderStatus) =>
    api.patch<Order>(`${BASE}/${encodeURIComponent(id)}/status`, { status }),

  /** Order history for the user detail page. */
  listByUser: (userId: string, params: ListParams = {}) =>
    orderService.list({ ...params, filters: { ...params.filters, userId } }),
};
