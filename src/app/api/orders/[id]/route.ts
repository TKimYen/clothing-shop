// src/app/api/orders/[id]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/src/lib/db";
import { cancelOrderAndRestock } from "@/src/lib/order-cancel";

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

// PATCH: Khách hủy đơn hàng của mình (LAB – điền các phần TODO)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Xác thực: lấy người dùng đang đăng nhập từ phiên Clerk
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ success: false, error: { message: "User not found" } }, { status: 404 });
    }
 
    // Next.js 16: params là Promise nên phải await
    const { id: orderId } = await params;
    const { status } = await request.json();
 
    // TODO A (Bước 6): chỉ chấp nhận status = "CANCELLED", giá trị khác trả 400
 
    // TODO B (Bước 7): đơn phải tồn tại (không thì 404) và thuộc về user (không thì 403)
 
    // TODO C (Bước 8): gọi cancelOrderAndRestock(tx, orderId, ["PENDING"]) trong prisma.$transaction;
    //                  hàm trả false thì trả 400, trả true thì trả 200 kèm đơn mới
 
    return NextResponse.json(
      { success: false, error: { message: "Chưa làm xong lab" } },
      { status: 501 }
    );
  } catch (error: unknown) {
    console.error("LỖI PATCH ORDER:", error);
    return NextResponse.json(
      { success: false, error: { message: error instanceof Error ? error.message : "Lỗi hệ thống" } },
      { status: 500 }
    );
  }
}
