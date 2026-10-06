import type { Product, ProductInput, ProductOptions } from "@/src/types";
import { api, crudClient } from "./http";

const BASE = "/api/admin/products";

export const productService = {
  ...crudClient<Product, ProductInput>(BASE),

  /** Reference data for the form's selects. */
  options: () => api.get<ProductOptions>(`${BASE}/options`),
};
