// src/app/api/cart/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';

// Giả lập lấy cart của user hiện tại (trong thực tế em có thể lấy từ session/Auth hoặc cookie)
// Ở đây ta tạm thời dùng một userId mặc định hoặc lấy cart đầu tiên của hệ thống để test
async function getOrCreateCart(userId?: string) {
  // Nếu chưa truyền userId, lấy user đầu tiên trong bảng users để làm mẫu
  let targetUserId = userId;
  if (!targetUserId) {
    const defaultUser = await prisma.user.findFirst();
    if (!defaultUser) throw new Error("Chưa có user nào trong hệ thống");
    targetUserId = defaultUser.id;
  }

  let cart = await prisma.cart.findUnique({
    where: { userId: targetUserId },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        userId: targetUserId,
        updatedAt: new Date(),
      },
    });
  }

  return cart;
}

// GET: Lấy danh sách sản phẩm trong giỏ hàng
export async function GET(request: Request) {
  try {
    const cart = await getOrCreateCart();

    const cartItems = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        variant: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { sortOrder: 'asc' },
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

    return NextResponse.json({ success: true, data: cartItems });
  } catch (error) {
    console.error("Lỗi lấy giỏ hàng:", error);
    return NextResponse.json({ success: false, error: "Không thể tải giỏ hàng" }, { status: 500 });
  }
}

// POST: Thêm sản phẩm vào giỏ hàng hoặc cập nhật số lượng
export async function POST(request: Request) {
  try {
    const { variantId, quantity = 1 } = await request.json();
    if (!variantId) {
      return NextResponse.json({ success: false, error: "Thiếu variantId" }, { status: 400 });
    }

    const cart = await getOrCreateCart();

    // Kiểm tra xem variant này đã có trong giỏ hàng chưa
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId,
        },
      },
    });

    if (existingItem) {
      // Nếu có rồi thì cộng dồn số lượng
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      // Nếu chưa có thì tạo mới item trong giỏ
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId,
          quantity,
        },
      });
    }

    // Cập nhật lại thời gian giỏ hàng
    await prisma.cart.update({
      where: { id: cart.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: "Đã thêm vào giỏ hàng" });
  } catch (error) {
    console.error("Lỗi thêm giỏ hàng:", error);
    return NextResponse.json({ success: false, error: "Không thể thêm vào giỏ hàng" }, { status: 500 });
  }
}

// DELETE: Xóa hoặc giảm số lượng sản phẩm trong giỏ hàng
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json({ success: false, error: "Thiếu itemId" }, { status: 400 });
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true, message: "Đã xóa sản phẩm" });
  } catch (error) {
    console.error("Lỗi xóa giỏ hàng:", error);
    return NextResponse.json({ success: false, error: "Không thể xóa sản phẩm" }, { status: 500 });
  }
}