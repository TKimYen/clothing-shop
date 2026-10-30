// src/app/api/admin/reviews/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/src/lib/db";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: { message: "Forbidden" } },
        { status: 403 }
      );
    }

    const reviews = await prisma.review.findMany({
      include: {
        product: { select: { name: true, slug: true } },
        user: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: reviews });
  } catch (error: any) {
    console.error("Lỗi lấy danh sách đánh giá admin:", error);
    return NextResponse.json(
      { success: false, error: { message: error.message || "Lỗi hệ thống" } },
      { status: 500 }
    );
  }
}