import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import {
  calculateCouponDiscount,
  CouponValidationError,
  type CouponPaymentMethod,
  type CouponScope,
} from "@/src/lib/coupon";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 },
      );
    }

    const body = await request.json();
    const code = typeof body.code === "string" ? body.code : "";
    const scope: CouponScope =
      body.scope === "SHIPPING" ? "SHIPPING" : "PRODUCT";
    const paymentMethod: CouponPaymentMethod =
      body.paymentMethod === "BANK_TRANSFER" ? "BANK_TRANSFER" : "COD";
    const subtotal = Number(body.subtotal);
    const shippingFee = Number(body.shippingFee);

    if (
      !Number.isFinite(subtotal) ||
      subtotal <= 0 ||
      !Number.isFinite(shippingFee) ||
      shippingFee < 0
    ) {
      return NextResponse.json(
        { success: false, error: { message: "Thông tin đơn hàng không hợp lệ" } },
        { status: 400 },
      );
    }

    const result = await calculateCouponDiscount(
      prisma,
      code,
      scope,
      subtotal,
      shippingFee,
      paymentMethod,
    );

    return NextResponse.json({
      success: true,
      data: {
        code: result.code,
        scope,
        discount: result.discount,
        description: result.coupon.description,
      },
    });
  } catch (error) {
    if (error instanceof CouponValidationError) {
      return NextResponse.json(
        { success: false, error: { message: error.message } },
        { status: 400 },
      );
    }

    console.error("Lỗi kiểm tra coupon:", error);
    return NextResponse.json(
      { success: false, error: { message: "Không thể kiểm tra mã giảm giá" } },
      { status: 500 },
    );
  }
}
