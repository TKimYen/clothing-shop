// src/app/checkout/page.tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
import {
  MapPin,
  CreditCard,
  Ticket,
  ShoppingBag,
  Loader2,
  Truck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Address = {
  id: string;
  recipientName: string;
  phone: string;
  fullAddress: string;
  isDefault: boolean;
};

type PaymentMethodItem = {
  id: string;
  provider: string;
  accountNumber: string;
  isDefault: boolean;
};

type CartItem = {
  id: string;
  quantity: number;
  variant: {
    id: string;
    product: {
      name: string;
      price: number;
      salePrice?: number | null;
      images: { url: string }[];
    };
    color: { name: string };
    size: { label: string };
  };
};

export default function CheckoutPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  const [payments, setPayments] = useState<PaymentMethodItem[]>([]);
  const [paymentType, setPaymentType] = useState<"COD" | "ONLINE">("COD");
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>("");

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Voucher state riêng biệt
  const [productCoupon, setProductCoupon] = useState("");
  const [productDiscount, setProductDiscount] = useState(0);

  const [shipCoupon, setShipCoupon] = useState("");
  const [shipDiscount, setShipDiscount] = useState(0);

  async function fetchData() {
    try {
      // 1. Lấy địa chỉ từ DB
      const addrRes = await fetch("/api/addresses");
      const addrData = await addrRes.json();
      if (addrData.success && Array.isArray(addrData.data)) {
        setAddresses(addrData.data);
        const def =
          addrData.data.find((a: Address) => a.isDefault) || addrData.data[0];
        if (def) setSelectedAddressId(def.id);
      }

      // 2. Lấy phương thức thanh toán từ DB
      const payRes = await fetch("/api/payments");
      const payData = await payRes.json();
      if (payData.success && Array.isArray(payData.data)) {
        setPayments(payData.data);
        const defPay =
          payData.data.find((p: PaymentMethodItem) => p.isDefault) ||
          payData.data[0];
        if (defPay) setSelectedPaymentId(defPay.id);
      }

      // 3. Lấy sản phẩm từ giỏ hàng (DB) - Bóc tách chuẩn từ cartData.data
      const cartRes = await fetch("/api/cart", { cache: "no-store" });
      const cartData = await cartRes.json();

      if (cartData.success && Array.isArray(cartData.data)) {
        setCartItems(cartData.data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData().catch((error) =>
      console.error("Lỗi tải dữ liệu checkout:", error),
    );
  }, []);

  // Tính tiền từ giỏ hàng
  const subtotal = cartItems.reduce((acc, item) => {
    const price =
      item.variant?.product?.salePrice ?? item.variant?.product?.price ?? 0;
    return acc + Number(price) * item.quantity;
  }, 0);

  const originalShippingFee = subtotal >= 600000 || subtotal === 0 ? 0 : 30000;
  const finalShippingFee = Math.max(0, originalShippingFee - shipDiscount);
  const totalAmount = Math.max(
    0,
    subtotal + finalShippingFee - productDiscount,
  );

  function handleApplyProductCoupon() {
    if (productCoupon.toUpperCase() === "GIAM10K") {
      setProductDiscount(10000);
      alert("Đã áp dụng mã giảm giá sản phẩm thành công!");
    } else {
      alert("Mã giảm giá sản phẩm không hợp lệ");
    }
  }

  function handleApplyShipCoupon() {
    if (shipCoupon.toUpperCase() === "FREESHIP") {
      setShipDiscount(30000);
      alert("Đã áp dụng mã miễn phí vận chuyển thành công!");
    } else {
      alert("Mã vận chuyển không hợp lệ");
    }
  }

  async function handlePlaceOrder(e: FormEvent) {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert("Giỏ hàng của bạn đang trống, không thể thanh toán!");
      return;
    }
    if (!selectedAddressId) {
      alert("Vui lòng chọn địa chỉ nhận hàng");
      return;
    }
    if (paymentType === "ONLINE" && !selectedPaymentId) {
      alert(
        "Vui lòng chọn tài khoản ngân hàng hoặc ví điện tử để thanh toán online",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddressId,
          paymentMethod: paymentType === "COD" ? "COD" : "BANK_TRANSFER",
          paymentMethodId: selectedPaymentId,
          productDiscount,
          shipDiscount,
        }),
      });

      const result = await res.json();
      if (result.success) {
        alert("Đặt hàng thành công!");
        router.push("/orders");
      } else {
        alert(result.error?.message || "Không thể đặt hàng");
      }
    } catch (error) {
      console.error("Lỗi đặt hàng:", error);
      alert("Lỗi kết nối máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 gap-2 text-gray-500">
        <Loader2 className="animate-spin text-[#164F8D]" size={20} />
        <span className="text-sm">
          Đang tải thông tin thanh toán từ hệ thống...
        </span>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <main className="container mx-auto px-4 py-16 max-w-lg text-center bg-white rounded-2xl border border-gray-100 shadow-xs mt-10">
        <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3" />
        <h2 className="text-lg font-bold text-gray-800">
          Giỏ hàng của bạn đang trống
        </h2>
        <p className="text-xs text-gray-500 mt-1 mb-6">
          Bạn cần thêm sản phẩm vào giỏ hàng trước khi tiến hành thanh toán.
        </p>
        <Link
          href="/products"
          className="bg-[#164F8D] hover:bg-[#123d6d] text-white text-xs px-6 py-2.5 rounded-xl font-semibold transition-colors"
        >
          Quay lại mua sắm
        </Link>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-[#164F8D] mb-6">
        Tiến hành thanh toán
      </h1>

      <form
        onSubmit={handlePlaceOrder}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Cột trái: Địa chỉ, Kiểm tra sản phẩm từ giỏ hàng, Phương thức thanh toán */}
        <div className="md:col-span-2 space-y-6">
          {/* 1. Địa chỉ nhận hàng */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <MapPin size={16} className="text-[#164F8D]" />
                Địa chỉ nhận hàng
              </h2>
              <a
                href="/account"
                className="text-xs text-[#164F8D] hover:underline font-medium"
              >
                Quản lý địa chỉ
              </a>
            </div>

            {addresses.length === 0 ? (
              <div className="text-xs text-red-500">
                Chưa có địa chỉ nào.{" "}
                <a href="/account" className="underline font-bold">
                  Thêm địa chỉ ngay
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedAddressId === addr.id
                        ? "border-[#164F8D] bg-blue-50/20"
                        : "border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1"
                    />
                    <div className="text-xs">
                      <p className="font-semibold text-gray-800">
                        {addr.recipientName} | {addr.phone}
                      </p>
                      <p className="text-gray-600 mt-1">{addr.fullAddress}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 2. Kiểm tra sản phẩm trong giỏ hàng */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
            <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2 mb-3 pb-2 border-b">
              <ShoppingBag size={16} className="text-[#164F8D]" />
              Kiểm tra sản phẩm ({cartItems.length})
            </h2>

            <div className="space-y-3 divide-y divide-gray-100">
              {cartItems.map((item) => {
                const product = item.variant?.product;
                if (!product) return null;
                const price = product.salePrice ?? product.price;
                return (
                  <div
                    key={item.id}
                    className="pt-3 first:pt-0 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 border relative">
                        <img
                          src={product.images?.[0]?.url || "/placeholder.png"}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 line-clamp-1">
                          {product.name}
                        </p>
                        <p className="text-gray-500 text-[11px] mt-0.5">
                          Phân loại: {item.variant?.color?.name || ""},{" "}
                          {item.variant?.size?.label || ""}
                        </p>
                        <p className="text-gray-500 text-[11px]">
                          Số lượng: x{item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-800">
                      {(Number(price) * item.quantity).toLocaleString()}đ
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Phương thức thanh toán & Chọn tài khoản ví/ngân hàng */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-3">
            <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2 pb-2 border-b">
              <CreditCard size={16} className="text-[#164F8D]" />
              Phương thức thanh toán
            </h2>

            <div className="space-y-3 text-xs">
              <label
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${paymentType === "COD" ? "border-[#164F8D] bg-blue-50/20" : "border-gray-200"}`}
              >
                <input
                  type="radio"
                  name="paymentType"
                  checked={paymentType === "COD"}
                  onChange={() => setPaymentType("COD")}
                />
                <span className="font-medium text-gray-800">
                  Thanh toán khi nhận hàng (COD)
                </span>
              </label>

              <div
                className={`p-3 rounded-lg border transition-all ${paymentType === "ONLINE" ? "border-[#164F8D] bg-blue-50/20" : "border-gray-200"}`}
              >
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentType"
                    checked={paymentType === "ONLINE"}
                    onChange={() => setPaymentType("ONLINE")}
                  />
                  <span className="font-medium text-gray-800">
                    Thanh toán chuyển khoản / Ví điện tử đã liên kết
                  </span>
                </label>

                {paymentType === "ONLINE" && (
                  <div className="mt-3 pl-6 space-y-2 border-t pt-3 border-gray-200">
                    {payments.length === 0 ? (
                      <div className="text-xs text-red-500">
                        Bạn chưa liên kết tài khoản ngân hàng hoặc ví nào.{" "}
                        <a
                          href="/account/paymentmethods"
                          className="underline font-semibold"
                        >
                          Liên kết ngay
                        </a>
                      </div>
                    ) : (
                      payments.map((p) => (
                        <label
                          key={p.id}
                          className={`flex items-center justify-between p-2 rounded border cursor-pointer bg-white ${selectedPaymentId === p.id ? "border-[#164F8D] ring-1 ring-[#164F8D]" : "border-gray-200"}`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="selectedPayment"
                              checked={selectedPaymentId === p.id}
                              onChange={() => setSelectedPaymentId(p.id)}
                            />
                            <span className="font-bold text-gray-800">
                              {p.provider}
                            </span>
                          </div>
                          <span className="font-mono text-gray-500">
                            •••• {p.accountNumber.slice(-4)}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Mã ưu đãi tách riêng & Tổng tiền & Nút Đặt hàng */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
            <h2 className="font-bold text-gray-800 text-sm border-b pb-3">
              Mã ưu đãi
            </h2>

            {/* Mã giảm giá sản phẩm */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
                <Ticket size={13} className="text-[#164F8D]" /> Mã giảm giá sản
                phẩm
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã (VD: GIAM10K)"
                  value={productCoupon}
                  onChange={(e) => setProductCoupon(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-[#164F8D]"
                />
                <button
                  type="button"
                  onClick={handleApplyProductCoupon}
                  className="bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-black cursor-pointer"
                >
                  Áp dụng
                </button>
              </div>
            </div>

            {/* Mã miễn phí vận chuyển */}
            <div className="space-y-1.5 pt-2 border-t border-gray-100">
              <label className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
                <Truck size={13} className="text-[#164F8D]" /> Mã miễn phí vận
                chuyển
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã (VD: FREESHIP)"
                  value={shipCoupon}
                  onChange={(e) => setShipCoupon(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-[#164F8D]"
                />
                <button
                  type="button"
                  onClick={handleApplyShipCoupon}
                  className="bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-black cursor-pointer"
                >
                  Áp dụng
                </button>
              </div>
            </div>

            {/* Tổng tiền đơn hàng */}
            <div className="space-y-2 text-xs pt-4 border-t text-gray-600">
              <div className="flex justify-between">
                <span>Tạm tính:</span>
                <span className="font-semibold text-gray-800">
                  {subtotal.toLocaleString()}đ
                </span>
              </div>
              <div className="flex justify-between">
                <span>Phí vận chuyển:</span>
                <span className="font-semibold text-gray-800">
                  {finalShippingFee === 0
                    ? "Miễn phí"
                    : `${finalShippingFee.toLocaleString()}đ`}
                </span>
              </div>
              {shipDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm phí ship:</span>
                  <span>-{shipDiscount.toLocaleString()}đ</span>
                </div>
              )}
              {productDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá sản phẩm:</span>
                  <span>-{productDiscount.toLocaleString()}đ</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-[#164F8D] pt-3 border-t">
                <span>Tổng cộng:</span>
                <span>{totalAmount.toLocaleString()}đ</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#164F8D] hover:bg-[#123d6d] text-white text-xs py-3 rounded-xl font-semibold shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              <span>
                {isSubmitting ? "Đang xử lý đơn hàng..." : "Đặt hàng ngay"}
              </span>
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
