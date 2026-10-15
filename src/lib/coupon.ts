import type { Prisma } from "@/src/generated/prisma/client";

export type CouponScope = "PRODUCT" | "SHIPPING";
export type CouponPaymentMethod = "COD" | "BANK_TRANSFER";

export class CouponValidationError extends Error {}

type CouponRecord = Prisma.CouponModel;

type CouponClient = {
  coupon: {
    findUnique: (args: {
      where: { code: string };
    }) => Promise<CouponRecord | null>;
  };
};

export async function calculateCouponDiscount(
  db: CouponClient,
  code: string,
  scope: CouponScope,
  subtotal: number,
  shippingFee: number,
  paymentMethod: CouponPaymentMethod = "COD",
) {
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) {
    throw new CouponValidationError("Vui lòng nhập mã giảm giá");
  }

  const coupon = await db.coupon.findUnique({
    where: { code: normalizedCode },
  });
  const now = new Date();

  if (
    !coupon ||
    !coupon.isActive ||
    coupon.startsAt > now ||
    coupon.endsAt < now
  ) {
    throw new CouponValidationError("Mã giảm giá không tồn tại hoặc đã hết hạn");
  }

  if (coupon.scope !== scope) {
    throw new CouponValidationError(
      scope === "PRODUCT"
        ? "Mã này chỉ áp dụng cho phí vận chuyển"
        : "Mã này chỉ áp dụng cho sản phẩm",
    );
  }

  if (
    coupon.requiredPaymentMethod !== null &&
    coupon.requiredPaymentMethod !== paymentMethod
  ) {
    throw new CouponValidationError(
      coupon.requiredPaymentMethod === "BANK_TRANSFER"
        ? "Mã này chỉ dùng khi thanh toán chuyển khoản"
        : "Mã này chỉ dùng khi thanh toán COD",
    );
  }

  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    throw new CouponValidationError("Mã giảm giá đã hết lượt sử dụng");
  }

  if (subtotal < Number(coupon.minOrderAmount)) {
    throw new CouponValidationError(
      `Đơn hàng tối thiểu để dùng mã là ${Number(coupon.minOrderAmount).toLocaleString("vi-VN")}đ`,
    );
  }

  const baseAmount = scope === "SHIPPING" ? shippingFee : subtotal;
  let discount =
    coupon.discountType === "PERCENT"
      ? (baseAmount * Number(coupon.discountValue)) / 100
      : Number(coupon.discountValue);

  if (coupon.maxDiscountAmount !== null) {
    discount = Math.min(discount, Number(coupon.maxDiscountAmount));
  }

  discount = Math.min(Math.max(0, discount), baseAmount);

  if (discount <= 0) {
    throw new CouponValidationError(
      scope === "SHIPPING"
        ? "Mã giảm giá không áp dụng được cho phí vận chuyển"
        : "Mã giảm giá không tạo ra mức giảm hợp lệ",
    );
  }

  return {
    coupon,
    code: coupon.code,
    discount,
  };
}
