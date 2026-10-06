import type { ListParams, ListResult, StockImport, StockImportInput } from "@/src/types";
import { api, listQuery } from "./http";

const BASE = "/api/admin/stock-imports";

/** Phiếu nhập hàng — the only way stock goes up. Imports cannot be edited or deleted. */
export const stockImportService = {
  list: (params: ListParams = {}) => api.get<ListResult<StockImport>>(`${BASE}${listQuery(params)}`),

  listByProduct: (productId: string, params: ListParams = {}) =>
    stockImportService.list({ ...params, filters: { ...params.filters, productId } }),

  create: (input: StockImportInput) => api.post<StockImport>(BASE, input),
};
