import type { Coupon, CouponInput } from "@/src/types";
import { crudClient } from "./http";

/** `usedCount` is never sent: the API ignores it and keeps the stored value. */
export const couponService = crudClient<Coupon, CouponInput>("/api/admin/coupons");
