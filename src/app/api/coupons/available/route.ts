import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import {
  calculateCouponDiscount,
  CouponValidationError,
  type CouponPaymentMethod,
  type CouponScope,
} from "@/src/lib/coupon";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 },
      );
    }

    const params = new URL(request.url).searchParams;
    const scope: CouponScope =
      params.get("scope") === "SHIPPING" ? "SHIPPING" : "PRODUCT";
    const paymentMethod: CouponPaymentMethod =
      params.get("paymentMethod") === "BANK_TRANSFER"
        ? "BANK_TRANSFER"
        : "COD";
    const subtotal = Number(params.get("subtotal"));
    const shippingFee = Number(params.get("shippingFee"));

    if (
      !Number.isFinite(subtotal) ||
      subtotal <= 0 ||
      !Number.isFinite(shippingFee) ||
      shippingFee < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Thông tin đơn hàng không hợp lệ" },
        },
        { status: 400 },
      );
    }

    const coupons = await prisma.coupon.findMany({
      where: { isActive: true, scope },
      orderBy: { startsAt: "desc" },
    });

    const data = await Promise.all(
      coupons.map(async (coupon) => {
        try {
          const result = await calculateCouponDiscount(
            prisma,
            coupon.code,
            scope,
            subtotal,
            shippingFee,
            paymentMethod,
          );
          return {
            id: coupon.id,
            code: coupon.code,
            description: coupon.description,
            scope: coupon.scope,
            discount: result.discount,
            eligible: true,
            reason: null,
            remainingAmount: 0,
          };
        } catch (error) {
          const reason =
            error instanceof CouponValidationError
              ? error.message
              : "Mã giảm giá chưa thể sử dụng";
          const remainingAmount = Math.max(
            0,
            Number(coupon.minOrderAmount) - subtotal,
          );
          return {
            id: coupon.id,
            code: coupon.code,
            description: coupon.description,
            scope: coupon.scope,
            discount: 0,
            eligible: false,
            reason,
            remainingAmount,
          };
        }
      }),
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Lỗi tải danh sách coupon:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            "Không thể tải coupon. Vui lòng áp dụng migration database trước.",
        },
      },
      { status: 503 },
    );
  }
}
