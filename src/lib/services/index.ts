/**
 * The single data boundary between the admin UI and the `/api/admin/*` routes.
 * Components import from here and never call `fetch` directly.
 */
export { ServiceError, NotFoundError, ConflictError, isServiceError, errorMessage } from "./errors";
export { categoryService } from "./categoryService";
export { collectionService } from "./collectionService";
export { sizeService } from "./sizeService";
export { colorService } from "./colorService";
export { productService } from "./productService";
export { couponService } from "./couponService";
export { orderService } from "./orderService";
export { userService } from "./userService";
export { dashboardService } from "./dashboardService";
export { stockImportService } from "./stockImportService";
export type { DashboardSummary, LowStockRow } from "./dashboardService";
export type { UserStats } from "./userService";
export { LOW_STOCK_THRESHOLD } from "./constants";
