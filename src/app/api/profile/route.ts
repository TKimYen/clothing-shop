import { auth } from "@clerk/nextjs/server";

import { apiError, apiSuccess } from "@/src/lib/api-response";
import { prisma } from "@/src/lib/db";

async function getCurrentUser() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      clerkId,
    },
    include: {
      addresses: {
        orderBy: [{ isDefault: "desc" }, { id: "desc" }],
      },
    },
  });
}

/**
 * GET /api/profile
 *
 * Lấy thông tin profile của user hiện tại.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Unauthorized", 401);
    }

    return apiSuccess({
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Failed to load profile:", error);

    return apiError("Unable to load profile", 500);
  }
}

/**
 * PATCH /api/profile
 *
 * Cập nhật thông tin cá nhân.
 *
 * Body:
 * {
 *   "fullName": "Nguyen Van A",
 *   "phone": "0901234567"
 * }
 */
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const body = await request.json();

    const fullName =
      typeof body.fullName === "string" ? body.fullName.trim() : undefined;

    const phone =
      typeof body.phone === "string" ? body.phone.trim() : undefined;

    if (fullName !== undefined && fullName.length < 2) {
      return apiError("Họ tên phải có ít nhất 2 ký tự", 400);
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        ...(fullName !== undefined ? { fullName } : {}),
        ...(phone !== undefined ? { phone: phone || null } : {}),
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return apiSuccess(updatedUser);
  } catch (error) {
    console.error("Failed to update profile:", error);
    return apiError("Unable to update profile", 500);
  }
}
