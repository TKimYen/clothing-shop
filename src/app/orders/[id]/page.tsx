// src/app/orders/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Package, MapPin, CreditCard, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import Image from "next/image";

type OrderItem = {
  id: string;
  productName: string;
  sizeLabel: string;
  colorName: string;
  unitPrice: number;
  quantity: number;
  variant: {
    product: {
      images: { url: string }[];
    };
  };
};

type OrderDetail = {
  id: string;
  orderCode: string;
  status: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  note: string | null;
  createdAt: string;
  items: OrderItem[];
  payment?: {
    method: string;
    status: string;
  };
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  async function fetchOrderDetail() {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders/${orderId}`);
      const result = await res.json();
      if (result.success) {
        setOrder(result.data);
      } else {
        toast.error(result.error?.message || "Không thể tải thông tin đơn hàng");
      }
    } catch (error) {
      console.error("Lỗi tải chi tiết đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelOrder() {
    if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;

    try {
      setCancelling(true);
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Hủy đơn hàng thành công");
        fetchOrderDetail(); // Tải lại thông tin đơn hàng
      } else {
        toast.error(result.error?.message || "Không thể hủy đơn hàng");
      }
    } catch (error) {
      console.error("Lỗi hủy đơn hàng:", error);
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 gap-2 text-gray-500">
        <Loader2 className="animate-spin text-[#164F8D]" size={20} />
        <span className="text-sm">Đang tải chi tiết đơn hàng...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md">
        <AlertCircle size={48} className="mx-auto text-red-400 mb-3" />
        <h2 className="text-lg font-bold text-gray-800">Không tìm thấy đơn hàng</h2>
        <p className="text-xs text-gray-500 mt-1 mb-6">Đơn hàng không tồn tại hoặc bạn không có quyền xem.</p>
        <Link href="/orders" className="bg-[#164F8D] text-white text-xs px-5 py-2.5 rounded-xl font-semibold">
          Quay lại danh sách đơn hàng
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="bg-yellow-100 text-yellow-800 text-[11px] px-3 py-1 rounded-full font-semibold">Chờ xác nhận</span>;
      case "CONFIRMED":
        return <span className="bg-blue-100 text-blue-800 text-[11px] px-3 py-1 rounded-full font-semibold">Đã xác nhận</span>;
      case "SHIPPING":
        return <span className="bg-purple-100 text-purple-800 text-[11px] px-3 py-1 rounded-full font-semibold">Đang giao</span>;
      case "DELIVERED":
        return <span className="bg-green-100 text-green-800 text-[11px] px-3 py-1 rounded-full font-semibold">Đã giao</span>;
      case "CANCELLED":
        return <span className="bg-red-100 text-red-800 text-[11px] px-3 py-1 rounded-full font-semibold">Đã hủy</span>;
      default:
        return null;
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <Link href="/orders" className="inline-flex items-center gap-1.5 text-xs text-[#164F8D] hover:underline font-medium">
          <ArrowLeft size={16} /> Quay lại danh sách đơn hàng
        </Link>
        {getStatusBadge(order.status)}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-6">
        {/* Mã đơn hàng & Ngày đặt */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-2">
          <div>
            <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Package size={20} className="text-[#164F8D]" />
              Mã đơn: {order.orderCode}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Ngày đặt: {new Date(order.createdAt).toLocaleString("vi-VN")}
            </p>
          </div>

          {/* Nút Hủy đơn hàng (Chỉ hiện khi trạng thái là PENDING) */}
          {order.status === "PENDING" && (
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs px-4 py-2 rounded-xl font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {cancelling && <Loader2 size={13} className="animate-spin" />}
              Hủy đơn hàng
            </button>
          )}
        </div>

        {/* Địa chỉ nhận hàng & Thanh toán */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-1.5">
            <h3 className="font-bold text-gray-800 flex items-center gap-1.5 mb-2">
              <MapPin size={15} className="text-[#164F8D]" /> Địa chỉ nhận hàng
            </h3>
            <p className="font-semibold text-gray-800">{order.recipientName} | {order.recipientPhone}</p>
            <p className="text-gray-600">{order.shippingAddress}</p>
            {order.note && (
              <p className="text-gray-500 italic mt-2 pt-2 border-t border-gray-200">
                <span className="font-medium">Ghi chú:</span> {order.note}
              </p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-1.5">
            <h3 className="font-bold text-gray-800 flex items-center gap-1.5 mb-2">
              <CreditCard size={15} className="text-[#164F8D]" /> Hình thức thanh toán
            </h3>
            <p className="font-semibold text-gray-800">
              {order.payment?.method === "BANK_TRANSFER" ? "Chuyển khoản ngân hàng" : "Thanh toán khi nhận hàng (COD)"}
            </p>
            <p className="text-gray-600">
              Trạng thái thanh toán:{" "}
              <span className={`font-semibold ${order.payment?.status === "PAID" ? "text-green-600" : "text-orange-600"}`}>
                {order.payment?.status === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}
              </span>
            </p>
          </div>
        </div>

        {/* Danh sách sản phẩm trong đơn */}
        <div>
          <h3 className="font-bold text-gray-800 text-sm mb-3">Sản phẩm đã đặt ({order.items.length})</h3>
          <div className="space-y-3 divide-y divide-gray-100">
            {order.items.map((item) => {
              const imageUrl = item.variant?.product?.images?.[0]?.url || "/placeholder.png";
              return (
                <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0 border relative">
                      <Image src={imageUrl} alt={item.productName} fill className="object-cover" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{item.productName}</p>
                      <p className="text-gray-500 text-[11px] mt-0.5">
                        Phân loại: {item.colorName}, {item.sizeLabel}
                      </p>
                      <p className="text-gray-500 text-[11px]">Số lượng: x{item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-gray-800">{(Number(item.unitPrice) * item.quantity).toLocaleString()}đ</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tổng kết tiền */}
        <div className="border-t pt-4 space-y-2 text-xs text-gray-600 max-w-sm ml-auto">
          <div className="flex justify-between">
            <span>Tạm tính:</span>
            <span className="font-semibold text-gray-800">{Number(order.subtotal).toLocaleString()}đ</span>
          </div>
          <div className="flex justify-between">
            <span>Phí vận chuyển:</span>
            <span className="font-semibold text-gray-800">{Number(order.shippingFee).toLocaleString()}đ</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Giảm giá:</span>
              <span>-{Number(order.discountAmount).toLocaleString()}đ</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-[#164F8D] pt-3 border-t">
            <span>Tổng cộng:</span>
            <span>{Number(order.totalAmount).toLocaleString()}đ</span>
          </div>
        </div>
      </div>
    </main>
  );
}