// src/app/api/admin/contacts/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";

export const dynamic = "force-dynamic";

// Lấy danh sách liên hệ
export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: contacts,
    });
  } catch (error) {
    console.error("Lỗi khi tải danh sách liên hệ:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: "Không thể tải danh sách liên hệ." },
      },
      { status: 500 },
    );
  }
}

// Cập nhật trạng thái đã đọc (isRead = true)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: "Thiếu ID tin nhắn." } },
        { status: 400 },
      );
    }

    const updatedContact = await prisma.contact.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      data: updatedContact,
    });
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái tin nhắn:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: "Không thể cập nhật trạng thái." },
      },
      { status: 500 },
    );
  }
}