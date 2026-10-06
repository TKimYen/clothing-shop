import type { Collection, CollectionInput } from "@/src/types";
import { SEASONS } from "@/src/types";
import { api, crudClient } from "./http";

const BASE = "/api/admin/collections";

export const collectionService = {
  ...crudClient<Collection, CollectionInput>(BASE),

  counts: () => api.get<Record<string, number>>(`${BASE}/counts`),

  /** Seasons come from the Prisma enum, so no request is needed. */
  async seasons(): Promise<string[]> {
    return SEASONS.map((season) => season.value);
  },
};
