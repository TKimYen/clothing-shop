// src/app/api/reviews/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/src/lib/db";

export async function POST(request: Request) {
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

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "User not found" } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { productId, rating, comment, orderId } = body;

    if (!productId || !rating) {
      return NextResponse.json(
        { success: false, error: { message: "Thiếu thông tin đánh giá" } },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        rating: Number(rating),
        comment: comment?.trim() || null,
        productId,
        userId: user.id,
        orderId: orderId || null,
      },
    });

    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    console.error("Lỗi khi tạo đánh giá:", error);
    return NextResponse.json(
      { success: false, error: { message: "Lỗi hệ thống khi gửi đánh giá" } },
      { status: 500 }
    );
  }
}