import { z } from "zod";
import type { Coupon, CouponInput } from "@/src/types";
import {
  requiredText,
  optionalText,
  moneyString,
  optionalMoneyString,
  integerString,
  optionalIntegerString,
  requiredDateTime,
} from "./shared";

export const couponFormSchema = z
  .object({
    code: requiredText("Code", 40).transform((value) => value.toUpperCase()),
    description: optionalText(500),
    discountType: z.enum(["PERCENT", "FIXED"]),
    discountValue: moneyString("Discount value", 0),
    minOrderAmount: moneyString("Minimum order amount", 0),
    maxDiscountAmount: optionalMoneyString("Maximum discount amount"),
    maxUses: optionalIntegerString("Maximum uses", 1, 1_000_000),
    startsAt: requiredDateTime("Start date"),
    endsAt: requiredDateTime("End date"),
    isActive: z.boolean(),
    /** Present in the payload so the form can display it, never sent onward. */
    usedCount: integerString("Used count", 0, 1_000_000),
  })
  .superRefine((values, ctx) => {
    if (values.discountType === "PERCENT" && values.discountValue > 100) {
      ctx.addIssue({
        code: "custom",
        path: ["discountValue"],
        message: "A percentage discount must be between 0 and 100",
      });
    }
    if (
      values.maxDiscountAmount !== null &&
      values.discountType === "FIXED" &&
      values.maxDiscountAmount < values.discountValue
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["maxDiscountAmount"],
        message: "Maximum discount cannot be lower than the discount value",
      });
    }
    if (new Date(values.endsAt) <= new Date(values.startsAt)) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "End date must be after the start date",
      });
    }
  });

export type CouponFormValues = z.input<typeof couponFormSchema>;
export type CouponFormOutput = z.output<typeof couponFormSchema>;

/** `usedCount` is read-only, so it is stripped here rather than in the form. */
export function toCouponInput(values: CouponFormOutput): CouponInput {
  return {
    code: values.code,
    description: values.description,
    discountType: values.discountType,
    discountValue: values.discountValue,
    minOrderAmount: values.minOrderAmount,
    maxDiscountAmount: values.maxDiscountAmount,
    maxUses: values.maxUses,
    startsAt: values.startsAt,
    endsAt: values.endsAt,
    isActive: values.isActive,
  };
}

export function toCouponFormDefaultValues(coupon: Coupon | null): CouponFormValues {
  return {
    code: coupon?.code ?? "",
    description: coupon?.description ?? "",
    discountType: coupon?.discountType ?? "PERCENT",
    discountValue: coupon ? String(coupon.discountValue) : "",
    minOrderAmount: coupon ? String(coupon.minOrderAmount) : "",
    maxDiscountAmount:
      coupon?.maxDiscountAmount === null || coupon?.maxDiscountAmount === undefined
        ? ""
        : String(coupon.maxDiscountAmount),
    maxUses: coupon?.maxUses === null || coupon?.maxUses === undefined ? "" : String(coupon.maxUses),
    startsAt: coupon ? coupon.startsAt.slice(0, 16) : "",
    endsAt: coupon ? coupon.endsAt.slice(0, 16) : "",
    isActive: coupon?.isActive ?? true,
    usedCount: coupon ? String(coupon.usedCount) : "0",
  };
}
