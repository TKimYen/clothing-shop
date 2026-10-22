// src/app/api/orders/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/src/lib/db";
import {
  calculateCouponDiscount,
  CouponValidationError,
} from "@/src/lib/coupon";

class OutOfStockError extends Error {}

// 1. Lấy danh sách đơn hàng (tự động hủy & hoàn kho nếu quá 24h chưa thanh toán)
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ success: true, data: [] });
    }

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        items: true,
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Kiểm tra tự động hủy đơn quá 24h chưa thanh toán
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      if (
        order.status === "PENDING" &&
        order.payment?.status === "UNPAID" &&
        new Date(order.createdAt) < twentyFourHoursAgo
      ) {
        orders[i] = await prisma.$transaction(async (tx) => {
          const cancelledOrder = await tx.order.update({
            where: { id: order.id },
            data: { status: "CANCELLED" },
            include: { items: true, payment: true },
          });

          for (const item of cancelledOrder.items) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stockQuantity: {
                  increment: item.quantity,
                },
              },
            });
          }

          return cancelledOrder;
        });
      }
    }

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error("Lỗi lấy danh sách đơn hàng:", error);
    return NextResponse.json(
      { success: false, error: { message: "Lỗi hệ thống" } },
      { status: 500 },
    );
  }
}

// 2. Tạo đơn hàng mới từ giỏ hàng
export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "User not found" } },
        { status: 404 },
      );
    }

    const body = await request.json();
    const {
      addressId,
      paymentMethod = "COD",
      productCouponCode,
      shippingCouponCode,
      note,
    } = body;
    const couponPaymentMethod =
      paymentMethod === "BANK_TRANSFER" ? "BANK_TRANSFER" : "COD";

    if (!addressId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Vui lòng chọn địa chỉ nhận hàng" },
        },
        { status: 400 },
      );
    }

    const address = await prisma.address.findUnique({
      where: { id: addressId, userId: user.id },
    });

    if (!address) {
      return NextResponse.json(
        { success: false, error: { message: "Địa chỉ không tồn tại" } },
        { status: 400 },
      );
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
                color: true,
                size: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: "Giỏ hàng trống" } },
        { status: 400 },
      );
    }

    let subtotal = 0;
    for (const item of cart.items) {
      const price =
        item.variant.product.salePrice ?? item.variant.product.price;
      subtotal += Number(price) * item.quantity;
    }

    const originalShippingFee =
      subtotal >= 600000 || subtotal === 0 ? 0 : 30000;
    let productCoupon: Awaited<
      ReturnType<typeof calculateCouponDiscount>
    > | null = null;
    let shippingCoupon: Awaited<
      ReturnType<typeof calculateCouponDiscount>
    > | null = null;

    if (typeof productCouponCode === "string" && productCouponCode.trim()) {
      productCoupon = await calculateCouponDiscount(
        prisma,
        productCouponCode,
        "PRODUCT",
        subtotal,
        originalShippingFee,
        couponPaymentMethod,
      );
    }

    if (typeof shippingCouponCode === "string" && shippingCouponCode.trim()) {
      shippingCoupon = await calculateCouponDiscount(
        prisma,
        shippingCouponCode,
        "SHIPPING",
        subtotal,
        originalShippingFee,
        couponPaymentMethod,
      );
    }

    if (
      productCoupon &&
      shippingCoupon &&
      productCoupon.coupon.id === shippingCoupon.coupon.id
    ) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Không thể dùng cùng một mã cho hai loại ưu đãi" },
        },
        { status: 400 },
      );
    }

    const productDiscount = productCoupon?.discount ?? 0;
    const shipDiscount = shippingCoupon?.discount ?? 0;
    const finalShippingFee = Math.max(0, originalShippingFee - shipDiscount);
    const totalDiscount = productDiscount + shipDiscount;
    const totalAmount = Math.max(
      0,
      subtotal - productDiscount + finalShippingFee,
    );

    if (totalAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message:
              "Tổng đơn hàng phải lớn hơn 0đ. Vui lòng chọn mã giảm giá khác.",
          },
        },
        { status: 400 },
      );
    }

    if (paymentMethod !== "COD" && paymentMethod !== "BANK_TRANSFER") {
      return NextResponse.json(
        { success: false, error: { message: "Phương thức thanh toán không hợp lệ" } },
        { status: 400 },
      );
    }

    const orderCode = "DH" + Date.now().toString().slice(-10);

    const order = await prisma.$transaction(async (tx) => {
      for (const appliedCoupon of [productCoupon, shippingCoupon]) {
        if (!appliedCoupon) continue;

        const updatedCoupon = await tx.coupon.updateMany({
          where: {
            id: appliedCoupon.coupon.id,
            isActive: true,
            startsAt: { lte: new Date() },
            endsAt: { gte: new Date() },
            ...(appliedCoupon.coupon.maxUses === null
              ? {}
              : { usedCount: { lt: appliedCoupon.coupon.maxUses } }),
          },
          data: { usedCount: { increment: 1 } },
        });

        if (updatedCoupon.count === 0) {
          throw new CouponValidationError(
            `Mã ${appliedCoupon.coupon.code} vừa hết lượt sử dụng`,
          );
        }
      }

      const newOrder = await tx.order.create({
        data: {
          orderCode,
          userId: user.id,
          couponId: productCoupon?.coupon.id,
          recipientName: address.recipientName,
          recipientPhone: address.phone,
          shippingAddress: address.fullAddress,
          subtotal,
          shippingFee: finalShippingFee,
          discountAmount: totalDiscount,
          totalAmount,
          status: "PENDING",
          note: note || null,
        },
      });

      for (const item of cart.items) {
        const price =
          item.variant.product.salePrice ?? item.variant.product.price;
        
        const updated = await tx.productVariant.updateMany({
          where: {
            id: item.variantId,
            stockQuantity: { gte: item.quantity },
          },
          data: {
            stockQuantity: { decrement: item.quantity },
          },
        });

        if (updated.count === 0) {
          throw new OutOfStockError(
            `"${item.variant.product.name}" (${item.variant.color?.name} / ${item.variant.size?.label}) không đủ hàng`,
          );
        }

        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            variantId: item.variantId,
            productName: item.variant.product.name,
            colorName: item.variant.color?.name || "",
            sizeLabel: item.variant.size?.label || "",
            unitPrice: price,
            quantity: item.quantity,
          },
        });
      }

      let mappedMethod: "COD" | "BANK_TRANSFER" | "VNPAY" | "MOMO" = "COD";
      if (paymentMethod === "BANK_TRANSFER") mappedMethod = "BANK_TRANSFER";
      else if (paymentMethod === "MOMO") mappedMethod = "MOMO";
      else if (paymentMethod === "VNPAY") mappedMethod = "VNPAY";
      else if (paymentMethod === "VISA" || paymentMethod === "MASTERCARD") mappedMethod = "BANK_TRANSFER";

      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          method: mappedMethod,
          status: "UNPAID",
          amount: totalAmount,
        },
      });

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    if (error instanceof OutOfStockError || error instanceof CouponValidationError) {
      return NextResponse.json(
        { success: false, error: { message: error.message } },
        { status: 400 },
      );
    }
    console.error("Lỗi tạo đơn hàng:", error);
    return NextResponse.json(
      { success: false, error: { message: "Lỗi hệ thống khi tạo đơn hàng" } },
      { status: 500 },
    );
  }
}