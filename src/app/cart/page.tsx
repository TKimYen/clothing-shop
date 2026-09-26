// src/app/cart/page.tsx
'use client';

import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

// Dữ liệu mẫu giỏ hàng
const initialCartItems = [
  { id: 1, name: 'Áo thun Unisex', price: 299000, quantity: 1, img: '/images/t_shirt_1.png', size: 'M' },
  { id: 2, name: 'Áo hoodie Unisex', price: 499000, quantity: 2, img: '/images/hoodie_1.png', size: 'L' },
];

export default function CartPage() {
  const [cartItems, setCartItems] = useState(initialCartItems);

  // Tăng số lượng
  const increaseQty = (id: number) => {
    setCartItems(cartItems.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item));
  };

  // Giảm số lượng
  const decreaseQty = (id: number) => {
    setCartItems(cartItems.map(item => item.id === id && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item));
  };

  // Xóa sản phẩm
  const removeItem = (id: number) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  // Tính tổng tiền
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 600000 || subtotal === 0 ? 0 : 30000;
  const total = subtotal + (subtotal > 0 ? shipping : 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[#164F8D] mb-8">Giỏ hàng của bạn</h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
          <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 mb-6 text-lg">Giỏ hàng của bạn đang trống</p>
          <Link href="/products" className="inline-block bg-[#17579B] text-white px-8 py-3 rounded-full font-medium hover:opacity-90 transition-colors">
            Tiếp tục mua sắm
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Danh sách sản phẩm trong giỏ */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm items-center">
                <div className="w-20 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                </div>

                <div className="flex-grow">
                  <h3 className="font-semibold text-gray-800">{item.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">Phân loại / Size: <span className="font-medium text-gray-700">{item.size}</span></p>
                  <p className="font-bold text-[#164F8D] mt-2">{item.price.toLocaleString()}đ</p>
                </div>

                {/* Điều chỉnh số lượng */}
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button onClick={() => decreaseQty(item.id)} className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold">-</button>
                  <span className="px-4 py-1 text-sm font-semibold">{item.quantity}</span>
                  <button onClick={() => increaseQty(item.id)} className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold">+</button>
                </div>

                {/* Nút xóa */}
                <button onClick={() => removeItem(item.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          {/* Khung tổng tiền & Thanh toán */}
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 h-fit">
            <h2 className="text-lg font-bold text-[#164F8D] mb-4 pb-3 border-b">Thông tin đơn hàng</h2>

            <div className="space-y-3 text-sm text-gray-600 mb-6">
              <div className="flex justify-between">
                <span>Tạm tính:</span>
                <span className="font-semibold text-gray-800">{subtotal.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between">
                <span>Phí vận chuyển:</span>
                <span className="font-semibold text-gray-800">
                  {shipping === 0 ? <span className="text-green-600">Miễn phí</span> : `${shipping.toLocaleString()}đ`}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#164F8D] pt-3 border-t">
                <span>Tổng cộng:</span>
                <span className="text-xl">{total.toLocaleString()}đ</span>
              </div>
            </div>

            <button className="w-full bg-[#17579B] hover:opacity-90 text-white py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-md">
              <span>Tiến hành thanh toán</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}