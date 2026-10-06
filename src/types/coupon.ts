export type DiscountType = "PERCENT" | "FIXED";

export type Coupon = {
  id: string;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  /** `null` = unlimited. */
  maxUses: number | null;
  /** Read-only. Incremented by the order flow, never editable in the admin form. */
  usedCount: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

/** `usedCount` is intentionally absent: it is read-only. */
export type CouponInput = Omit<Coupon, "id" | "usedCount">;
