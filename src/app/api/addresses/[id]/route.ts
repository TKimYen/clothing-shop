import { auth } from "@clerk/nextjs/server";
import { apiError, apiSuccess } from "@/src/lib/api-response";
import { prisma } from "@/src/lib/db";

/**
 * Lấy Prisma User hiện tại từ Clerk session.
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
 * PATCH /api/addresses/:id
 *
 * Có thể cập nhật:
 * - recipientName
 * - phone
 * - fullAddress
 * - isDefault
 *
 * Body ví dụ:
 * {
 *   "recipientName": "Nguyen Van B",
 *   "phone": "0912345678",
 *   "fullAddress": "456 Le Loi, Quan 1, TP.HCM"
 * }
 *
 * Hoặc chỉ:
 *
 * {
 *   "isDefault": true
 * }
 */
export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const { id } = await context.params;

    if (!id) {
      return apiError("Address id is required", 400);
    }

    // Chỉ được thao tác với address thuộc user hiện tại
    const existingAddress = await prisma.address.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingAddress) {
      return apiError("Address not found", 404);
    }

    const body = await request.json();

    const {
      recipientName,
      phone,
      fullAddress,
      isDefault,
    } = body;

    // Validate nếu field được gửi lên
    if (
      recipientName !== undefined &&
      (typeof recipientName !== "string" ||
        recipientName.trim() === "")
    ) {
      return apiError("recipientName must be a non-empty string", 400);
    }

    if (
      phone !== undefined &&
      (typeof phone !== "string" ||
        phone.trim() === "")
    ) {
      return apiError("phone must be a non-empty string", 400);
    }

    if (
      fullAddress !== undefined &&
      (typeof fullAddress !== "string" ||
        fullAddress.trim() === "")
    ) {
      return apiError("fullAddress must be a non-empty string", 400);
    }

    if (
      isDefault !== undefined &&
      typeof isDefault !== "boolean"
    ) {
      return apiError("isDefault must be a boolean", 400);
    }

    /*
     * Nếu request đặt địa chỉ này thành default,
     * bỏ default của các địa chỉ khác.
     */
    const address = await prisma.$transaction(async (tx) => {
      if (isDefault === true) {
        await tx.address.updateMany({
          where: {
            userId: user.id,
            id: {
              not: id,
            },
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      return tx.address.update({
        where: {
          id,
        },
        data: {
          ...(recipientName !== undefined
            ? {
                recipientName: recipientName.trim(),
              }
            : {}),

          ...(phone !== undefined
            ? {
                phone: phone.trim(),
              }
            : {}),

          ...(fullAddress !== undefined
            ? {
                fullAddress: fullAddress.trim(),
              }
            : {}),

          ...(isDefault !== undefined
            ? {
                isDefault,
              }
            : {}),
        },
      });
    });

    return apiSuccess(address);
  } catch (error) {
    console.error("Failed to update address:", error);

    return apiError("Unable to update address", 500);
  }
}

/**
 * DELETE /api/addresses/:id
 *
 * Xóa một địa chỉ thuộc user hiện tại.
 */
export async function DELETE(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const { id } = await context.params;

    if (!id) {
      return apiError("Address id is required", 400);
    }

    // Kiểm tra address có thuộc user hiện tại không
    const existingAddress = await prisma.address.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingAddress) {
      return apiError("Address not found", 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.address.delete({
        where: {
          id,
        },
      });

      /*
       * Nếu vừa xóa địa chỉ mặc định,
       * tự động chọn một địa chỉ còn lại làm default.
       */
      if (existingAddress.isDefault) {
        const nextAddress = await tx.address.findFirst({
          where: {
            userId: user.id,
          },
          orderBy: {
            id: "desc",
          },
        });

        if (nextAddress) {
          await tx.address.update({
            where: {
              id: nextAddress.id,
            },
            data: {
              isDefault: true,
            },
          });
        }
      }
    });

    return apiSuccess({
      id,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete address:", error);

    return apiError("Unable to delete address", 500);
  }
}