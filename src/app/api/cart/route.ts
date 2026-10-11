// src/app/api/cart/route.ts

import { auth, currentUser } from "@clerk/nextjs/server";

import { Prisma } from "@/src/generated/prisma/client";
import { apiError, apiSuccess } from "@/src/lib/api-response";
import { prisma } from "@/src/lib/db";

/**
 * Lấy Prisma User tương ứng với Clerk User hiện tại.
 *
 * Flow:
 * Clerk userId
 *      ↓
 * User.clerkId
 *      ↓
 * Prisma User
 *
 * Nếu Clerk User chưa tồn tại trong Prisma:
 * - Nếu email đã tồn tại → liên kết User đó với Clerk
 * - Nếu email chưa tồn tại → tạo User mới
 */
async function getCurrentUser() {
  const { userId: clerkId } = await auth();

  // Chưa đăng nhập Clerk
  if (!clerkId) {
    return null;
  }

  // 1. Tìm User bằng clerkId
  const existingUser = await prisma.user.findUnique({
    where: {
      clerkId,
    },
  });

  if (existingUser) {
    return existingUser;
  }

  // 2. Lấy thông tin user từ Clerk
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error("Clerk user does not have an email address");
  }

  const fullName =
    [clerkUser.firstName, clerkUser.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || email.split("@")[0];

  // 3. Kiểm tra email đã tồn tại trong Prisma chưa
  const existingEmailUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingEmailUser) {
    // User cũ đã có trong database.
    // Chỉ cần liên kết với Clerk.
    return prisma.user.update({
      where: {
        id: existingEmailUser.id,
      },
      data: {
        clerkId,
        fullName,
      },
    });
  }

  // 4. Nếu chưa có → tạo User mới
  //
  // passwordHash không được sử dụng cho Clerk authentication.
  // Giá trị này chỉ để đáp ứng field bắt buộc của schema.
  return prisma.user.create({
    data: {
      clerkId,
      email,
      passwordHash: "CLERK_MANAGED",
      fullName,
    },
  });
}

/**
 * Lấy Cart của user.
 * Nếu chưa có Cart thì tạo mới (upsert để 2 request cùng lúc không tạo trùng).
 */
async function getOrCreateCart(userId: string) {
  return prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

/** Lỗi trùng unique (vd. 2 request cùng tạo 1 CartItem). */
function isUniqueViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

/** Cập nhật lại thời gian giỏ hàng (updatedAt) mỗi khi item thay đổi. */
async function touchCart(cartId: string) {
  await prisma.cart.update({
    where: { id: cartId },
    data: { updatedAt: new Date() },
  });
}

/**
 * GET /api/cart
 *
 * Lấy danh sách sản phẩm trong giỏ hàng của user hiện tại.
 * `data` là mảng CartItem (kèm variant → product, size, color),
 * đúng định dạng trang /cart và Header đang dùng.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const cart = await prisma.cart.findUnique({
      where: {
        userId: user.id,
      },
      select: { id: true },
    });

    // User chưa có cart → giỏ hàng rỗng
    if (!cart) {
      return apiSuccess([]);
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        variant: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: {
                    sortOrder: "asc",
                  },
                  take: 1,
                },
              },
            },
            size: true,
            color: true,
          },
        },
      },
    });

    return apiSuccess(
      cartItems.map((item) => ({
        ...item,
        variant: {
          ...item.variant,
          product: {
            ...item.variant.product,
            price: Number(item.variant.product.price),
            salePrice:
              item.variant.product.salePrice === null
                ? null
                : Number(item.variant.product.salePrice),
          },
        },
      })),
    );
  } catch (error) {
    console.error("Failed to load cart:", error);

    return apiError("Unable to load cart", 500);
  }
}

/**
 * POST /api/cart
 *
 * Thêm sản phẩm vào cart. Nếu variant đã có thì cộng dồn số lượng.
 *
 * Body:
 * {
 *   "variantId": "...",
 *   "quantity": 1
 * }
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Vui lòng đăng nhập để thêm vào giỏ hàng", 401);
    }

    const body = await request.json();

    const variantId = body.variantId;
    const quantity = body.quantity ?? 1;

    // Kiểm tra variantId
    if (!variantId || typeof variantId !== "string") {
      return apiError("Vui lòng chọn màu sắc và kích thước", 400);
    }

    // Kiểm tra quantity
    if (!Number.isInteger(quantity) || quantity < 1) {
      return apiError("Số lượng không hợp lệ", 400);
    }

    // Kiểm tra ProductVariant (và sản phẩm còn đang bán)
    const variant = await prisma.productVariant.findUnique({
      where: {
        id: variantId,
      },
      include: {
        product: { select: { isActive: true } },
      },
    });

    if (!variant || !variant.product.isActive) {
      return apiError("Sản phẩm không tồn tại hoặc đã ngừng bán", 404);
    }

    // Kiểm tra tồn kho
    if (variant.stockQuantity <= 0) {
      return apiError("Sản phẩm này đã hết hàng", 400);
    }

    // Lấy hoặc tạo cart
    const cart = await getOrCreateCart(user.id);

    // Thêm mới hoặc cộng dồn. Nếu 2 request cùng tạo 1 item (bấm 2 lần / 2 tab)
    // thì request sau bị lỗi trùng → chạy lại 1 lần, lúc này sẽ đi nhánh cộng dồn.
    const addItem = async () => {
      // Kiểm tra variant đã tồn tại trong cart
      const existingItem = await prisma.cartItem.findUnique({
        where: {
          cartId_variantId: {
            cartId: cart.id,
            variantId,
          },
        },
      });

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;

        if (newQuantity > variant.stockQuantity) {
          const canAdd = variant.stockQuantity - existingItem.quantity;
          return apiError(
            canAdd > 0
              ? `Trong giỏ đã có ${existingItem.quantity} sản phẩm này, kho chỉ còn ${variant.stockQuantity} nên bạn chỉ thêm được tối đa ${canAdd}`
              : `Trong giỏ đã có ${existingItem.quantity} sản phẩm này, bằng số lượng còn trong kho`,
            400,
          );
        }

        const updatedItem = await prisma.cartItem.update({
          where: {
            id: existingItem.id,
          },
          data: {
            quantity: newQuantity,
            createdAt: new Date(),
          },
        });

        await touchCart(cart.id);

        return apiSuccess(updatedItem);
      }

      // Variant chưa có trong cart
      if (quantity > variant.stockQuantity) {
        return apiError(`Chỉ còn ${variant.stockQuantity} sản phẩm trong kho`, 400);
      }

      const cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId,
          quantity,
        },
      });

      await touchCart(cart.id);

      return apiSuccess(cartItem);
    };

    try {
      return await addItem();
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      return await addItem();
    }
  } catch (error) {
    console.error("Failed to add item to cart:", error);

    return apiError("Không thể thêm vào giỏ hàng, vui lòng thử lại", 500);
  }
}

/**
 * PATCH /api/cart
 *
 * Cập nhật số lượng CartItem.
 *
 * Body:
 * {
 *   "itemId": "...",
 *   "quantity": 2
 * }
 */
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const body = await request.json();

    const itemId = body.itemId;
    const quantity = body.quantity;

    if (!itemId || typeof itemId !== "string") {
      return apiError("itemId is required", 400);
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return apiError("quantity must be a positive integer", 400);
    }

    const cart = await prisma.cart.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!cart) {
      return apiError("Cart not found", 404);
    }

    // Chỉ lấy item thuộc cart của user hiện tại
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
      include: {
        variant: true,
      },
    });

    if (!cartItem) {
      return apiError("Cart item not found", 404);
    }

    // Không được vượt quá tồn kho
    if (quantity > cartItem.variant.stockQuantity) {
      return apiError(
        `Chỉ còn ${cartItem.variant.stockQuantity} sản phẩm trong kho`,
        400,
      );
    }

    const updatedItem = await prisma.cartItem.update({
      where: {
        id: cartItem.id,
      },
      data: {
        quantity,
      },
    });

    await touchCart(cart.id);

    return apiSuccess(updatedItem);
  } catch (error) {
    console.error("Failed to update cart item:", error);

    return apiError("Unable to update cart item", 500);
  }
}

/**
 * DELETE /api/cart?itemId=...
 *
 * Xóa CartItem khỏi cart của user hiện tại.
 */
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return apiError("itemId is required", 400);
    }

    const cart = await prisma.cart.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!cart) {
      return apiError("Cart not found", 404);
    }

    // Chỉ cho phép xóa item thuộc cart của user hiện tại
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!cartItem) {
      return apiError("Cart item not found", 404);
    }

    await prisma.cartItem.delete({
      where: {
        id: cartItem.id,
      },
    });

    await touchCart(cart.id);

    return apiSuccess({
      message: "Item removed from cart",
    });
  } catch (error) {
    console.error("Failed to delete cart item:", error);

    return apiError("Unable to remove item from cart", 500);
  }
}
