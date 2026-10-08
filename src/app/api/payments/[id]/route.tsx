// src/app/api/payments/[id]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/src/lib/db";

async function getCurrentUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  return await prisma.user.findUnique({ where: { clerkId } });
}

// Xóa phương thức thanh toán
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    const { id } = await params;

    await prisma.userPaymentMethod.delete({
      where: { id, userId: user.id },
    });

    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("Lỗi xóa:", error);
    return NextResponse.json({ success: false, error: { message: "Internal Server Error" } }, { status: 500 });
  }
}

// Cập nhật (Đặt làm mặc định)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isDefault } = body;

    const updated = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.userPaymentMethod.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        });
      }

      return await tx.userPaymentMethod.update({
        where: { id, userId: user.id },
        data: { isDefault },
      });
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Lỗi cập nhật:", error);
    return NextResponse.json({ success: false, error: { message: "Internal Server Error" } }, { status: 500 });
  }
}