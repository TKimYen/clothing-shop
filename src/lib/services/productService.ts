import type { Product, ProductInput, ProductOptions } from "@/src/types";
import { api, crudClient, request } from "./http";

const BASE = "/api/admin/products";

export const productService = {
  ...crudClient<Product, ProductInput>(BASE),

  /** Reference data for the form's selects. */
  options: () => api.get<ProductOptions>(`${BASE}/options`),

  /** Uploads an image file from the admin's computer; resolves to its served URL. */
  uploadImage(file: File) {
    const body = new FormData();
    body.append("file", file);
    return request<{ url: string }>("/api/admin/uploads", { method: "POST", body });
  },
};
