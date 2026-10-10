// src/app/cart/page.tsx
"use client";

import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type CartItem = {
  id: string;
  quantity: number;
  variant: {
    id: string;
    sku: string;
    stockQuantity: number;
    product: {
      name: string;
      slug: string;
      price: number;
      salePrice: number | null;
      images: Array<{ url: string }>;
    };
    size: {
      label: string;
    };
    color: {
      name: string;
    };
  };
};

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingQuantities, setEditingQuantities] = useState<
    Record<string, string>
  >({});

  // Hàm tải giỏ hàng từ API / Database
  const fetchCart = async () => {
    try {
      const res = await fetch("/api/cart");
      const result = await res.json();
      if (result.success) {
        setCartItems(result.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart().catch((error) => console.error("Lỗi tải giỏ hàng:", error));
  }, []);

  // Thay đổi số lượng (Tăng / Giảm)
  const updateQuantity = async (itemId: string, newQty: number) => {
    const item = cartItems.find((i) => i.id === itemId);
    if (!item) return;

    const stock = item.variant.stockQuantity;

    // Chặn ở giao diện
    if (newQty < 1) return;
    if (newQty > item.quantity && newQty > stock) {
      // Chỉ chặn khi TĂNG vượt tồn kho
      alert(`Chỉ còn ${stock} sản phẩm trong kho`);
      return;
    }
    if (newQty < item.quantity && newQty > stock) {
      // Đang vượt tồn kho mà bấm giảm → đưa thẳng về bằng tồn kho
      if (stock < 1) {
        alert("Sản phẩm đã hết hàng, vui lòng xóa khỏi giỏ hàng");
        return;
      }
      newQty = stock;
    }

    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity: newQty }),
      });
      const result = await res.json();

      if (res.ok && result.success) {
        setCartItems((items) =>
          items.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i)),
        );
      } else {
        alert(result.error?.message ?? "Không thể cập nhật số lượng");
        fetchCart().catch((error) => console.error("Lỗi tải giỏ hàng:", error));
      }
    } catch (error) {
      console.error("Lỗi cập nhật số lượng:", error);
    }
  };

  const handleQuantityInput = (item: CartItem, value: string) => {
    const digitsOnly = value.replace(/\D/g, "");

    if (digitsOnly === "") {
      setEditingQuantities((quantities) => ({
        ...quantities,
        [item.id]: "",
      }));
      return;
    }

    const quantity = Math.min(Number(digitsOnly), item.variant.stockQuantity);
    setEditingQuantities((quantities) => ({
      ...quantities,
      [item.id]: String(quantity),
    }));
  };

  const commitQuantityInput = (item: CartItem) => {
    const inputValue = editingQuantities[item.id];
    const quantity = inputValue
      ? Math.min(Number(inputValue), item.variant.stockQuantity)
      : item.quantity;

    setEditingQuantities((quantities) => {
      const nextQuantities = { ...quantities };
      delete nextQuantities[item.id];
      return nextQuantities;
    });

    if (quantity !== item.quantity) {
      void updateQuantity(item.id, quantity);
    }
  };

  // Xóa sản phẩm khỏi giỏ hàng trên DB
  const removeItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/cart?itemId=${itemId}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.success) {
        setCartItems(cartItems.filter((item) => item.id !== itemId));
      }
    } catch (error) {
      console.error("Lỗi xóa sản phẩm:", error);
    }
  };

  // Tính tổng tiền dựa trên giá thực tế của sản phẩm (ưu tiên salePrice nếu có)
  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.variant.product.salePrice ?? item.variant.product.price;
    return sum + Number(price) * item.quantity;
  }, 0);

  const shipping = subtotal >= 600000 || subtotal === 0 ? 0 : 30000;
  const total = subtotal + (subtotal > 0 ? shipping : 0);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        Đang tải giỏ hàng từ cơ sở dữ liệu...
      </div>
    );
  }

  //Khóa nút thanh toán nếu có sản phẩm vượt tồn kho
  const hasStockIssue = cartItems.some(
    (i) => i.quantity > i.variant.stockQuantity,
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[#164F8D] mb-8">
        Giỏ hàng của bạn
      </h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
          <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 mb-6 text-lg">
            Giỏ hàng của bạn đang trống
          </p>
          <Link
            href="/products"
            className="inline-block bg-[#17579B] text-white px-8 py-3 rounded-full font-medium hover:opacity-90 transition-colors"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Danh sách sản phẩm trong giỏ */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const product = item.variant.product;
              const displayPrice = product.salePrice ?? product.price;
              const imageUrl =
                product.images[0]?.url || "/images/t_shirt_1.png";

              return (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm items-center"
                >
                  <div className="relative w-20 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {item.variant.stockQuantity <= 10 ? (
                      <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1 py-1 text-center text-[10px] font-medium leading-tight text-white">
                        Còn {item.variant.stockQuantity}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex-grow">
                    <h3 className="font-semibold text-gray-800">
                      {product.name}
                    </h3>
                    {item.quantity > item.variant.stockQuantity ? (
                      <p className="text-xs text-red-600">
                        Chỉ còn {item.variant.stockQuantity} sản phẩm, vui lòng
                        giảm số lượng
                      </p>
                    ) : null}
                    <p className="text-sm text-gray-500 mt-1">
                      Size:{" "}
                      <span className="font-medium text-gray-700">
                        {item.variant.size.label}
                      </span>{" "}
                      | Màu:{" "}
                      <span className="font-medium text-gray-700">
                        {item.variant.color.name}
                      </span>
                    </p>
                    <p className="font-bold text-[#164F8D] mt-2">
                      {Number(displayPrice).toLocaleString()}đ
                    </p>
                  </div>

                  {/* Điều chỉnh số lượng */}
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={
                        editingQuantities[item.id] ?? String(item.quantity)
                      }
                      onChange={(event) =>
                        handleQuantityInput(item, event.target.value)
                      }
                      onBlur={() => commitQuantityInput(item)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.currentTarget.blur();
                        }
                      }}
                      aria-label={`Số lượng ${product.name}`}
                      className="w-16 px-2 py-1 text-center text-sm font-semibold outline-none"
                    />
                  </div>

                  {/* Nút xóa */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Khung tổng tiền & Thanh toán */}
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 h-fit">
            <h2 className="text-lg font-bold text-[#164F8D] mb-4 pb-3 border-b">
              Thông tin đơn hàng
            </h2>

            <div className="space-y-3 text-sm text-gray-600 mb-6">
              <div className="flex justify-between">
                <span>Tạm tính:</span>
                <span className="font-semibold text-gray-800">
                  {subtotal.toLocaleString("vi-VN")}đ
                </span>
              </div>
              <div className="flex justify-between">
                <span>Phí vận chuyển:</span>
                <span className="font-semibold text-gray-800">
                  {shipping === 0 ? (
                    <span className="text-green-600">Miễn phí</span>
                  ) : (
                    `${shipping.toLocaleString("vi-VN")}đ`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#164F8D] pt-3 border-t">
                <span>Tổng cộng:</span>
                <span className="text-xl">
                  {total.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>

            {hasStockIssue ? (
              <>
                <button
                  type="button"
                  disabled
                  className="w-full bg-gray-300 text-white py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <span>Tiến hành thanh toán</span>
                  <ArrowRight size={18} />
                </button>
                <p className="mt-3 text-center text-xs text-red-600">
                  Có sản phẩm vượt quá tồn kho, vui lòng giảm số lượng hoặc xóa
                </p>
              </>
            ) : (
              <Link
                href="/checkout"
                className="w-full bg-[#17579B] hover:opacity-90 text-white py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-md block text-center"
              >
                <span>Tiến hành thanh toán</span>
                <ArrowRight size={18} />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
