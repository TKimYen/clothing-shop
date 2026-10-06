import type { Color, ColorInput } from "@/src/types";
import { api, crudClient } from "./http";

const BASE = "/api/admin/colors";

export const colorService = {
  ...crudClient<Color, ColorInput>(BASE),

  counts: () => api.get<Record<string, number>>(`${BASE}/counts`),
};
