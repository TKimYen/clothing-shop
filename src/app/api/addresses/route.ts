import { auth } from "@clerk/nextjs/server";
import { apiError, apiSuccess } from "@/src/lib/api-response";
import { prisma } from "@/src/lib/db";

/**
 * Lấy Prisma User hiện tại từ Clerk session.
 *
 * Clerk userId = User.clerkId trong database.
 */
async function getCurrentUser() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      clerkId,
    },
  });

  return user;
}

/**
 * GET /api/addresses
 *
 * Lấy toàn bộ địa chỉ của user hiện tại.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const addresses = await prisma.address.findMany({
      where: {
        userId: user.id,
      },
      orderBy: [
        {
          isDefault: "desc",
        },
        {
          id: "desc",
        },
      ],
    });

    return apiSuccess(addresses);
  } catch (error) {
    console.error("Failed to load addresses:", error);

    return apiError("Unable to load addresses", 500);
  }
}

/**
 * POST /api/addresses
 *
 * Body:
 * {
 *   "recipientName": "Nguyen Van A",
 *   "phone": "0901234567",
 *   "fullAddress": "123 Nguyen Trai, Quan 1, TP.HCM",
 *   "isDefault": true
 * }
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const body = await request.json();

    const {
      recipientName,
      phone,
      fullAddress,
      isDefault = false,
    } = body;

    // Validate dữ liệu bắt buộc
    if (
      typeof recipientName !== "string" ||
      recipientName.trim() === ""
    ) {
      return apiError("recipientName is required", 400);
    }

    if (
      typeof phone !== "string" ||
      phone.trim() === ""
    ) {
      return apiError("phone is required", 400);
    }

    if (
      typeof fullAddress !== "string" ||
      fullAddress.trim() === ""
    ) {
      return apiError("fullAddress is required", 400);
    }

    if (typeof isDefault !== "boolean") {
      return apiError("isDefault must be a boolean", 400);
    }

    /*
     * Nếu địa chỉ mới được đặt làm mặc định,
     * bỏ default của các địa chỉ cũ.
     *
     * Nếu đây là địa chỉ đầu tiên thì tự động đặt làm default.
     */
    const addressCount = await prisma.address.count({
      where: {
        userId: user.id,
      },
    });

    const shouldBeDefault =
      isDefault || addressCount === 0;

    const address = await prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.address.updateMany({
          where: {
            userId: user.id,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      return tx.address.create({
        data: {
          userId: user.id,
          recipientName: recipientName.trim(),
          phone: phone.trim(),
          fullAddress: fullAddress.trim(),
          isDefault: shouldBeDefault,
        },
      });
    });

    return apiSuccess(address);
  } catch (error) {
    console.error("Failed to create address:", error);

    return apiError("Unable to create address", 500);
  }
}