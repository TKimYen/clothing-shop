import type { Category, CategoryInput } from "@/src/types";
import { api, crudClient } from "./http";

const BASE = "/api/admin/categories";

export const categoryService = {
  ...crudClient<Category, CategoryInput>(BASE),

  /** Product count per category, used by the list page. */
  counts: () => api.get<Record<string, number>>(`${BASE}/counts`),
};
