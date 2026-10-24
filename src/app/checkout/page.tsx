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
import {
  bankTransferInfo,
  hasBankTransferInfo,
} from "@/src/lib/payment-config";
import Image from "next/image";
import { toast } from "sonner";

type CouponOption = {
  id: string;
  code: string;
  description: string | null;
  scope: "PRODUCT" | "SHIPPING";
  discount: number;
  eligible: boolean;
  reason: string | null;
  remainingAmount: number;
};

async function readJsonResponse(response: Response) {
  const body = await response.text();
  if (!body) {
    throw new Error("Máy chủ không trả về dữ liệu coupon");
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new Error("Phản hồi từ máy chủ coupon không hợp lệ");
  }
}

function CouponList({
  options,
  selectedCode,
  onSelect,
}: {
  options: CouponOption[];
  selectedCode: string;
  onSelect: (code: string) => void;
}) {
  if (options.length === 0) return null;
  const sortedOptions = [...options].sort((a, b) => b.discount - a.discount);
  const selectedCodeNormalized = selectedCode.trim().toUpperCase();

  return (
    <div className="space-y-1 pt-1">
      {sortedOptions.map((coupon) => {
        const isSelected = selectedCodeNormalized === coupon.code.toUpperCase();

        return (
          <button
            key={coupon.id}
            type="button"
            disabled={!coupon.eligible}
            onClick={() => onSelect(coupon.code)}
            className={`w-full text-left rounded-lg border px-2.5 py-2 text-[11px] ${
              coupon.eligible
                ? isSelected
                  ? "border-[#164F8D] bg-blue-50"
                  : "border-gray-200 hover:border-[#164F8D]"
                : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
            }`}
          >
            <div className="flex items-start gap-2">
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
                  isSelected
                    ? "border-[#164F8D] bg-[#164F8D] text-white"
                    : "border-gray-400 bg-white text-transparent"
                }`}
              >
                ✓
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <span
                    className={`font-semibold ${
                      coupon.eligible ? "text-gray-800" : "text-gray-600"
                    }`}
                  >
                    {coupon.code}
                  </span>
                  {coupon.eligible && (
                    <span className="shrink-0 text-green-600">
                      Giảm {coupon.discount.toLocaleString("vi-VN")}đ
                    </span>
                  )}
                </div>
                {coupon.description && (
                  <p
                    className={`mt-0.5 ${
                      coupon.eligible ? "text-gray-600" : "text-gray-500"
                    }`}
                  >
                    {coupon.description}
                  </p>
                )}
                {!coupon.eligible && (
                  <span className="text-gray-600">
                    {coupon.remainingAmount > 0
                      ? `Mua thêm ${coupon.remainingAmount.toLocaleString("vi-VN")}đ để dùng`
                      : coupon.reason}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

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
  const [appliedProductCoupon, setAppliedProductCoupon] = useState("");

  const [shipCoupon, setShipCoupon] = useState("");
  const [shipDiscount, setShipDiscount] = useState(0);
  const [appliedShipCoupon, setAppliedShipCoupon] = useState("");
  const [couponOptions, setCouponOptions] = useState<CouponOption[]>([]);

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

      // 3. Lấy sản phẩm từ giỏ hàng và lọc theo các ID đã tick chọn ở trang Cart
      const cartRes = await fetch("/api/cart", { cache: "no-store" });
      const cartData = await cartRes.json();

      if (cartData.success && Array.isArray(cartData.data)) {
        const savedIds = sessionStorage.getItem("checkoutItemIds");
        if (savedIds) {
          const selectedIds: string[] = JSON.parse(savedIds);
          const filtered = cartData.data.filter((item: CartItem) =>
            selectedIds.includes(item.id),
          );
          setCartItems(filtered);
        } else {
          setCartItems(cartData.data);
        }
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

  // Tính tiền từ các sản phẩm được chọn
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
  const couponPaymentMethod =
    paymentType === "ONLINE" ? "BANK_TRANSFER" : "COD";

  useEffect(() => {
    if (subtotal <= 0) return;
    const params = new URLSearchParams({
      scope: "PRODUCT",
      subtotal: String(subtotal),
      shippingFee: String(originalShippingFee),
      paymentMethod: couponPaymentMethod,
    });
    const shippingParams = new URLSearchParams(params);
    shippingParams.set("scope", "SHIPPING");
    Promise.all([
      fetch(`/api/coupons/available?${params}`).then(readJsonResponse),
      fetch(`/api/coupons/available?${shippingParams}`).then(readJsonResponse),
    ])
      .then(([productResult, shippingResult]) => {
        const productCoupons =
          productResult.success && Array.isArray(productResult.data)
            ? productResult.data
            : [];
        const shippingCoupons =
          shippingResult.success && Array.isArray(shippingResult.data)
            ? shippingResult.data
            : [];
        setCouponOptions([...productCoupons, ...shippingCoupons]);
      })
      .catch((error) => console.error("Lỗi tải danh sách coupon:", error));
  }, [subtotal, originalShippingFee, couponPaymentMethod]);

  const productOptions = couponOptions.filter(
    (coupon) => coupon.scope === "PRODUCT",
  );
  const shippingOptions = couponOptions.filter(
    (coupon) => coupon.scope === "SHIPPING",
  );
  const couponConflict =
    productCoupon.trim() !== "" &&
    shipCoupon.trim() !== "" &&
    productCoupon.trim().toUpperCase() === shipCoupon.trim().toUpperCase();

  function ensureCouponIsNotDuplicated(code: string, otherCode: string) {
    if (
      code.trim().toUpperCase() === otherCode.trim().toUpperCase() &&
      code.trim()
    ) {
      throw new Error(
        "Không thể dùng cùng một mã cho giảm giá sản phẩm và vận chuyển",
      );
    }
  }

  async function handleApplyProductCoupon() {
    try {
      ensureCouponIsNotDuplicated(productCoupon, appliedShipCoupon);
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: productCoupon,
          scope: "PRODUCT",
          subtotal,
          shippingFee: originalShippingFee,
          paymentMethod: couponPaymentMethod,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error?.message ?? "Mã giảm giá không hợp lệ");
      }
      setProductDiscount(Number(result.data.discount));
      setAppliedProductCoupon(result.data.code);
      toast.success(`Đã giảm ${Number(result.data.discount).toLocaleString("vi-VN")}đ`);
    } catch (error) {
      setProductDiscount(0);
      setAppliedProductCoupon("");
      toast.error(
        error instanceof Error ? error.message : "Mã giảm giá không hợp lệ",
      );
    }
  }

  async function handleApplyShipCoupon() {
    try {
      ensureCouponIsNotDuplicated(shipCoupon, appliedProductCoupon);
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: shipCoupon,
          scope: "SHIPPING",
          subtotal,
          shippingFee: originalShippingFee,
          paymentMethod: couponPaymentMethod,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error?.message ?? "Mã vận chuyển không hợp lệ");
      }
      setShipDiscount(Number(result.data.discount));
      setAppliedShipCoupon(result.data.code);
      toast.success(
        `Đã giảm ${Number(result.data.discount).toLocaleString("vi-VN")}đ phí vận chuyển`,
      );
    } catch (error) {
      setShipDiscount(0);
      setAppliedShipCoupon("");
      toast.error(
        error instanceof Error ? error.message : "Mã vận chuyển không hợp lệ",
      );
    }
  }

  async function handlePlaceOrder(e: FormEvent) {
    e.preventDefault();
    const checkoutItemIds = cartItems.map((item) => item.id);
    if (checkoutItemIds.length === 0) {
      toast.error("Không có sản phẩm nào được chọn thanh toán");
      return;
    }
    if (!selectedAddressId) {
      toast.error("Vui lòng chọn địa chỉ nhận hàng");
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
          productCouponCode: appliedProductCoupon,
          shippingCouponCode: appliedShipCoupon,
          itemIds: checkoutItemIds,
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success("Đặt hàng thành công");
        sessionStorage.removeItem("checkoutItemIds");
        // Đơn chuyển khoản hiển thị mã QR thanh toán tại trang đơn hàng
        router.push("/orders");
      } else {
        toast.error(result.error?.message || "Không thể đặt hàng");
      }
    } catch (error) {
      console.error("Lỗi đặt hàng:", error);
      toast.error("Lỗi kết nối máy chủ");
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
      <div className="container mx-auto px-4 py-16 max-w-lg text-center bg-white rounded-2xl border border-gray-100 shadow-xs mt-10">
        <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3" />
        <h2 className="text-lg font-bold text-gray-800">
          Chưa có sản phẩm nào được chọn
        </h2>
        <p className="text-xs text-gray-500 mt-1 mb-6">
          Vui lòng quay lại giỏ hàng và tick chọn sản phẩm cần thanh toán.
        </p>
        <Link
          href="/cart"
          className="bg-[#164F8D] hover:bg-[#123d6d] text-white text-xs px-6 py-2.5 rounded-xl font-semibold transition-colors"
        >
          Quay lại giỏ hàng
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-[#164F8D] mb-6">
        Tiến hành thanh toán
      </h1>

      <form
        onSubmit={handlePlaceOrder}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Cột trái: Địa chỉ, Kiểm tra sản phẩm được chọn, Phương thức thanh toán */}
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

          {/* 2. Kiểm tra sản phẩm được chọn thanh toán */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
            <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2 mb-3 pb-2 border-b">
              <ShoppingBag size={16} className="text-[#164F8D]" />
              Sản phẩm thanh toán ({cartItems.length})
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
                        <Image
                          src={product.images?.[0]?.url || "/placeholder.png"}
                          alt={product.name}
                          fill
                          sizes="48px"
                          unoptimized
                          className="object-cover"
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
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-gray-700">
                      <p className="font-semibold text-[#164F8D]">
                        Thông tin chuyển khoản
                      </p>
                      {hasBankTransferInfo ? (
                        <div className="mt-2 space-y-1">
                          <p>
                            Ngân hàng:{" "}
                            <span className="font-semibold">
                              {bankTransferInfo.bankName || "Chưa cấu hình"}
                            </span>
                          </p>
                          <p>
                            Số tài khoản:{" "}
                            <span className="font-semibold">
                              {bankTransferInfo.accountNumber ||
                                "Chưa cấu hình"}
                            </span>
                          </p>
                          <p>
                            Chủ tài khoản:{" "}
                            <span className="font-semibold">
                              {bankTransferInfo.accountName || "Chưa cấu hình"}
                            </span>
                          </p>
                          {bankTransferInfo.branch ? (
                            <p>Chi nhánh: {bankTransferInfo.branch}</p>
                          ) : null}
                          <p className="pt-1 text-gray-500">
                            Nội dung: BlueWear + số điện thoại người nhận
                          </p>
                        </div>
                      ) : (
                        <p className="mt-1 text-amber-700">
                          Thông tin chuyển khoản chưa được cấu hình. Vui lòng
                          liên hệ cửa hàng trước khi thanh toán.
                        </p>
                      )}
                    </div>
                    {payments.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] text-gray-500">
                          Tài khoản đã liên kết (không bắt buộc):
                        </p>
                        {payments.map((p) => (
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
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Mã ưu đãi & Tổng tiền & Nút Đặt hàng */}
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
                  placeholder="Nhập mã giảm giá sản phẩm"
                  value={productCoupon}
                  onChange={(e) => {
                    setProductCoupon(e.target.value);
                    setProductDiscount(0);
                    setAppliedProductCoupon("");
                  }}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-[#164F8D]"
                />
                <button
                  type="button"
                  onClick={handleApplyProductCoupon}
                  disabled={couponConflict}
                  className="bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-black cursor-pointer"
                >
                  Áp dụng
                </button>
              </div>
              <CouponList
                options={productOptions}
                selectedCode={productCoupon}
                onSelect={(code) => setProductCoupon(code)}
              />
              {couponConflict && (
                <p className="text-[11px] text-red-600">
                  Không thể dùng cùng một mã cho sản phẩm và vận chuyển.
                </p>
              )}
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
                  placeholder="Nhập mã miễn phí vận chuyển"
                  value={shipCoupon}
                  onChange={(e) => {
                    setShipCoupon(e.target.value);
                    setShipDiscount(0);
                    setAppliedShipCoupon("");
                  }}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-[#164F8D]"
                />
                <button
                  type="button"
                  onClick={handleApplyShipCoupon}
                  disabled={couponConflict}
                  className="bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-black cursor-pointer"
                >
                  Áp dụng
                </button>
              </div>
              <CouponList
                options={shippingOptions}
                selectedCode={shipCoupon}
                onSelect={(code) => setShipCoupon(code)}
              />
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
    </div>
  );
}
