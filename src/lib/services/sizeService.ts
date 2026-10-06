import type { Size, SizeInput } from "@/src/types";
import { api, crudClient } from "./http";

const BASE = "/api/admin/sizes";

export const sizeService = {
  ...crudClient<Size, SizeInput>(BASE),

  counts: () => api.get<Record<string, number>>(`${BASE}/counts`),
};
