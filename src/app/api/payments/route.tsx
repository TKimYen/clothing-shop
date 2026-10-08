// src/app/api/payments/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/src/lib/db"; // Kiểm tra lại đường dẫn tới file prisma client của nhóm

async function getCurrentUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  return await prisma.user.findUnique({ where: { clerkId } });
}

// Lấy danh sách thẻ/ví của user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    const payments = await prisma.userPaymentMethod.findMany({
      where: { userId: user.id },
      orderBy: { isDefault: "desc" },
    });

    return NextResponse.json({ success: true, data: payments });
  } catch (error) {
    console.error("Lỗi lấy danh sách thanh toán:", error);
    return NextResponse.json({ success: false, error: { message: "Internal Server Error" } }, { status: 500 });
  }
}

// Thêm mới thẻ/ví
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    const body = await request.json();
    const { provider, accountNumber, accountName, isDefault } = body;

    if (!provider || !accountNumber || !accountName) {
      return NextResponse.json({ success: false, error: { message: "Thiếu thông tin bắt buộc" } }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.userPaymentMethod.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        });
      }

      // Nếu là cái đầu tiên, tự động cho làm mặc định luôn
      const count = await tx.userPaymentMethod.count({ where: { userId: user.id } });

      return await tx.userPaymentMethod.create({
        data: {
          userId: user.id,
          provider,
          accountNumber,
          accountName: accountName.toUpperCase(),
          isDefault: count === 0 ? true : isDefault,
        },
      });
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Lỗi thêm phương thức thanh toán:", error);
    return NextResponse.json({ success: false, error: { message: "Internal Server Error" } }, { status: 500 });
  }
}