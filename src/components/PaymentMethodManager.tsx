// src/components/PaymentMethodManager.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import { Plus, Trash2, Loader2, CreditCard, ShieldCheck } from "lucide-react";

type PaymentMethod = {
  id: string;
  provider: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
};

export default function PaymentMethodManager() {
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [provider, setProvider] = useState("MOMO");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  async function fetchPaymentMethods() {
    try {
      setLoading(true);
      const res = await fetch("/api/payments", { cache: "no-store" });
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setPayments(result.data);
      }
    } catch (error) {
      console.error("Lỗi tải phương thức thanh toán:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, accountNumber, accountName, isDefault }),
      });

      const result = await res.json();
      if (result.success) {
        setShowModal(false);
        resetForm();
        fetchPaymentMethods();
      } else {
        alert(result.error?.message || "Không thể thêm phương thức thanh toán");
      }
    } catch (error) {
      console.error("Lỗi khi lưu phương thức thanh toán:", error);
      alert("Lỗi kết nối máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa phương thức thanh toán này?")) return;
    try {
      const res = await fetch(`/api/payments/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        fetchPaymentMethods();
      } else {
        alert(result.error?.message || "Không thể xóa");
      }
    } catch (error) {
      console.error("Lỗi khi xóa:", error);
    }
  }

  async function handleSetDefault(id: string) {
    try {
      const res = await fetch(`/api/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });

      const result = await res.json();
      if (result.success) {
        fetchPaymentMethods();
      } else {
        alert(result.error?.message || "Không thể đặt mặc định");
      }
    } catch (error) {
      console.error("Lỗi đặt mặc định:", error);
    }
  }

  function resetForm() {
    setProvider("MOMO");
    setAccountNumber("");
    setAccountName("");
    setIsDefault(false);
  }

  if (loading && payments.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-500 gap-2">
        <Loader2 size={18} className="animate-spin text-[#164F8D]" />
        <span className="text-sm">Đang tải phương thức thanh toán...</span>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
      <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Tài khoản ngân hàng & Ví điện tử</h2>
          <p className="text-xs text-gray-500 mt-0.5">Quản lý các phương thức thanh toán và nhận tiền hoàn lại</p>
        </div>
        <button
          type="button"
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-[#164F8D] hover:bg-[#123d6d] text-white text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
        >
          <Plus size={15} />
          <span>Thêm liên kết</span>
        </button>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-xs border border-dashed border-gray-200 rounded-xl">
          <CreditCard size={32} className="mx-auto text-gray-300 mb-2" />
          Chưa có tài khoản ngân hàng hoặc ví điện tử nào được liên kết.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {payments.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border text-sm transition-all relative overflow-hidden ${
                item.isDefault ? "border-[#164F8D] bg-blue-50/20 shadow-xs" : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-[#164F8D] flex items-center justify-center font-bold text-xs shrink-0">
                    {item.provider.slice(0, 4)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 font-bold text-gray-800 text-sm">
                      <span>{item.provider}</span>
                      {item.isDefault && (
                        <span className="text-[10px] bg-[#164F8D] text-white px-1.5 py-0.5 rounded font-medium">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-xs font-mono mt-0.5">•••• {item.accountNumber.slice(-4)}</p>
                    <p className="text-gray-400 text-[11px] uppercase mt-0.5">{item.accountName}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="text-gray-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                    title="Xóa"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {!item.isDefault && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSetDefault(item.id)}
                    className="text-xs text-[#164F8D] hover:underline font-medium cursor-pointer"
                  >
                    Đặt làm mặc định
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold text-base text-[#164F8D] mb-4 pb-2 border-b">
              Liên kết tài khoản thanh toán
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Loại thanh toán / Ngân hàng</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#164F8D] bg-white"
                >
                  <option value="MOMO">Ví MoMo</option>
                  <option value="VNPAY">VNPay</option>
                  <option value="ZALOPAY">ZaloPay</option>
                  <option value="VIETCOMBANK">Vietcombank</option>
                  <option value="TPBANK">TPBank</option>
                  <option value="TECHCOMBANK">Techcombank</option>
                  <option value="MBBANK">MB Bank</option>
                  <option value="VISA">Thẻ Visa / Mastercard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Số tài khoản / Số thẻ / Số điện thoại ví</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Nhập số tài khoản hoặc số điện thoại ví"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#164F8D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tên chủ tài khoản (Không dấu)</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                  placeholder="NGUYEN VAN A"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#164F8D] uppercase"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modalPaymentDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-gray-300 text-[#164F8D] focus:ring-[#164F8D] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="modalPaymentDefault" className="text-xs text-gray-700 font-medium cursor-pointer">
                  Đặt làm phương thức thanh toán mặc định
                </label>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-2 text-xs text-[#164F8D] mt-2">
                <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                <span>Thông tin thanh toán của bạn được mã hóa an toàn và bảo mật tuyệt đối.</span>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs bg-[#164F8D] hover:bg-[#123d6d] text-white rounded-lg font-semibold shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer transition-colors"
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  <span>{isSubmitting ? "Đang liên kết..." : "Liên kết ngay"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}