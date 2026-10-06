import type { ListParams, ListResult, Role, User } from "@/src/types";
import { NotFoundError } from "./errors";
import { api, listQuery } from "./http";

const BASE = "/api/admin/users";

export type UserStats = {
  orderCount: number;
  lifetimeSpend: number;
  pendingCount: number;
};

export const userService = {
  list: (params: ListParams = {}) => api.get<ListResult<User>>(`${BASE}${listQuery(params)}`),

  async get(id: string): Promise<User | null> {
    try {
      return await api.get<User>(`${BASE}/${encodeURIComponent(id)}`);
    } catch (error) {
      if (error instanceof NotFoundError) return null;
      throw error;
    }
  },

  /** Cancelled orders are excluded from spend, matching the dashboard's revenue rule. */
  stats: (id: string) => api.get<UserStats>(`${BASE}/${encodeURIComponent(id)}/stats`),

  /** Role is the only mutable field. Addresses are read-only for the admin. */
  updateRole: (id: string, role: Role) =>
    api.patch<User>(`${BASE}/${encodeURIComponent(id)}/role`, { role }),
};
