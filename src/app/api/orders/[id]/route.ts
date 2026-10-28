// src/app/api/orders/[id]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/src/lib/db";

// GET: Lấy chi tiết một đơn hàng theo ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ success: false, error: { message: "User not found" } }, { status: 404 });
    }

    // Bắt buộc phải await params trong Next.js mới
    const resolvedParams = await params;
    const orderId = resolvedParams.id;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: { include: { images: true } },
                color: true,
                size: true,
              },
            },
          },
        },
        payment: true,
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: { message: "Không tìm thấy đơn hàng" } }, { status: 404 });
    }

    if (user.role === "CUSTOMER" && order.userId !== user.id) {
      return NextResponse.json({ success: false, error: { message: "Forbidden" } }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error: unknown) {
    console.error("LỖI CHI TIẾT GET ORDER:", error);
    return NextResponse.json(
      { success: false, error: { message: error instanceof Error ? error.message : "Lỗi hệ thống" } },
      { status: 500 },
    );
  }
}

// PATCH: Cập nhật trạng thái đơn hàng (Hủy đơn hàng và tự động hoàn kho)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ success: false, error: { message: "User not found" } }, { status: 404 });
    }

    // Bắt buộc phải await params trong Next.js mới
    const resolvedParams = await params;
    const orderId = resolvedParams.id;
    
    const body = await request.json();
    const { status } = body;

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ success: false, error: { message: "Không tìm thấy đơn hàng" } }, { status: 404 });
    }

    if (user.role === "CUSTOMER") {
      if (existingOrder.userId !== user.id) {
        return NextResponse.json({ success: false, error: { message: "Forbidden" } }, { status: 403 });
      }
      if (status === "CANCELLED" && existingOrder.status !== "PENDING") {
        return NextResponse.json(
          { success: false, error: { message: "Chỉ được hủy đơn hàng đang chờ xác nhận (PENDING)" } },
          { status: 400 }
        );
      }
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status: status || existingOrder.status },
      });

      // Nếu chuyển sang CANCELLED và trước đó chưa hủy -> Hoàn kho
      if (status === "CANCELLED" && existingOrder.status !== "CANCELLED") {
        for (const item of existingOrder.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stockQuantity: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      return order;
    });

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error: unknown) {
    console.error("LỖI CHI TIẾT PATCH ORDER:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Lỗi hệ thống khi cập nhật đơn hàng",
        },
      },
      { status: 500 },
    );
  }
}