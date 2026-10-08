// src/app/api/orders/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/src/lib/db";

class OutOfStockError extends Error {}

// 1. Lấy danh sách đơn hàng của user hiện tại
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
      productDiscount = 0,
      shipDiscount = 0,
    } = body;

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
    const finalShippingFee = Math.max(0, originalShippingFee - shipDiscount);
    const totalDiscount = productDiscount + shipDiscount;
    const totalAmount = Math.max(
      0,
      subtotal + finalShippingFee - totalDiscount,
    );

    const orderCode = "DH" + Date.now().toString().slice(-10);

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderCode,
          userId: user.id,
          recipientName: address.recipientName,
          recipientPhone: address.phone,
          shippingAddress: address.fullAddress,
          subtotal,
          shippingFee: finalShippingFee,
          discountAmount: totalDiscount,
          totalAmount,
          status: "PENDING",
        },
      });

      for (const item of cart.items) {
        const price =
          item.variant.product.salePrice ?? item.variant.product.price;
        // Trừ kho có điều kiện: chỉ trừ khi còn đủ hàng.
        // Kiểm tra và trừ cùng lúc nên 2 người mua đồng thời cũng không thể làm kho bị âm.
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
          // Không đủ hàng → throw để rollback toàn bộ đơn
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

      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          method: paymentMethod === "BANK_TRANSFER" ? "BANK_TRANSFER" : "COD",
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
    if (error instanceof OutOfStockError) {
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
