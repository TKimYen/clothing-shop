// src/app/orders/page.tsx
"use client";

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { buildBankTransferQrUrl } from "@/src/lib/payment-config";

type OrderItem = {
  id: string;
  productName: string;
  colorName: string;
  sizeLabel: string;
  quantity: number;
  unitPrice: number;
};

type Order = {
  id: string;
  orderCode: string;
  status: "PENDING" | "CONFIRMED" | "SHIPPING" | "DELIVERED" | "CANCELLED";
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
  payment?: {
    method: "COD" | "BANK_TRANSFER";
    status: "UNPAID" | "PAID" | "FAILED" | "REFUNDED";
  } | null;
};

const TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING", label: "Chờ xác nhận" },
  { key: "CONFIRMED", label: "Chờ lấy hàng" },
  { key: "SHIPPING", label: "Chờ giao hàng" },
  { key: "DELIVERED", label: "Đã giao" },
  { key: "CANCELLED", label: "Đã hủy" },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState("ALL");
  const [loading, setLoading] = useState(true);

  async function fetchOrders() {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setOrders(result.data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders().catch((error) =>
      console.error("Lỗi tải danh sách đơn hàng:", error),
    );
  }, []);
  
  const filteredOrders =
    activeTab === "ALL" ? orders : orders.filter((o) => o.status === activeTab);

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-[#164F8D] mb-6">
        Đơn hàng của tôi
      </h1>

      {/* Các tab trạng thái */}
      <div className="flex border-b border-gray-200 overflow-x-auto mb-6 bg-white rounded-t-xl shadow-xs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.key
                ? "border-[#164F8D] text-[#164F8D]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 text-xs">
          Đang tải đơn hàng...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-xs">
          <ShoppingBag size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 font-medium">
            Chưa có đơn hàng nào trong mục này
          </p>
          <Link
            href="/products"
            className="mt-4 inline-block bg-[#164F8D] text-white text-xs px-4 py-2 rounded-lg font-semibold hover:bg-[#123d6d]"
          >
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs"
            >
              <div className="flex flex-wrap justify-between items-center gap-2 pb-3 border-b border-gray-100 text-xs">
                <span className="font-bold text-gray-800">
                  Mã đơn: #{order.orderCode}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded font-medium ${
                      order.status === "DELIVERED"
                        ? "bg-green-100 text-green-700"
                        : order.status === "CANCELLED"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-[#164F8D]"
                    }`}
                  >
                    {order.status === "PENDING" && "Chờ xác nhận"}
                    {order.status === "CONFIRMED" && "Chờ lấy hàng"}
                    {order.status === "SHIPPING" && "Chờ giao hàng"}
                    {order.status === "DELIVERED" && "Đã giao hàng"}
                    {order.status === "CANCELLED" && "Đã hủy"}
                  </span>
                  <span
                    className={`px-2 py-1 rounded font-medium ${
                      order.payment?.status === "PAID"
                        ? "bg-green-100 text-green-700"
                        : order.payment?.status === "FAILED"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {order.payment?.status === "PAID"
                      ? "Đã thanh toán"
                      : order.payment?.status === "FAILED"
                        ? "Thanh toán thất bại"
                        : "Chưa thanh toán"}
                  </span>
                </div>
              </div>

              <div className="py-3 space-y-3">
                {order.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-xs"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">
                        {item.productName}
                      </p>
                      <p className="text-gray-500 text-[11px]">
                        Phân loại: {item.colorName}, {item.sizeLabel} x{" "}
                        {item.quantity}
                      </p>
                    </div>
                    <span className="font-medium text-gray-700">
                      {(item.unitPrice * item.quantity).toLocaleString()}đ
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  Ngày đặt:{" "}
                  {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#164F8D]">
                    Tổng tiền: {Number(order.totalAmount).toLocaleString()}đ
                  </span>
                  {order.status === "DELIVERED" && (
                    <button className="bg-[#164F8D] text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-[#123d6d] cursor-pointer">
                      Đánh giá
                    </button>
                  )}
                </div>
              </div>
              {order.payment?.method === "BANK_TRANSFER" &&
                order.payment.status === "UNPAID" &&
                (() => {
                  const qrUrl = buildBankTransferQrUrl(
                    order.orderCode,
                    Number(order.totalAmount),
                  );
                  if (!qrUrl) return null;

                  return (
                    <div className="mt-4 flex flex-col items-center gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-4 sm:flex-row sm:items-start">
                      <img
                        src={qrUrl}
                        alt={`QR thanh toán đơn ${order.orderCode}`}
                        className="h-48 w-48 rounded-lg bg-white p-2"
                      />
                      <div className="text-xs text-gray-700">
                        <p className="font-semibold text-[#164F8D]">
                          Quét QR để thanh toán chuyển khoản
                        </p>
                        <p className="mt-1">
                          Số tiền:{" "}
                          <strong>
                            {Number(order.totalAmount).toLocaleString("vi-VN")}đ
                          </strong>
                        </p>
                        <p className="mt-1">
                          Nội dung: <strong>BlueWear {order.orderCode}</strong>
                        </p>
                        <p className="mt-2 text-gray-500">
                          Đơn hàng sẽ được xác nhận sau khi cửa hàng kiểm tra giao dịch.
                        </p>
                      </div>
                    </div>
                  );
                })()}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
