// src/components/AddressManager.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import { Plus, Trash2, Edit2, Loader2, MapPin } from "lucide-react";

type Address = {
  id: string;
  recipientName: string;
  phone: string;
  fullAddress: string;
  isDefault: boolean;
};

export default function AddressManager() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  async function fetchAddresses() {
    try {
      setLoading(true);
      const res = await fetch("/api/addresses", { cache: "no-store" });
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setAddresses(result.data);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách địa chỉ:", error);
    } finally {
      setLoading(false);
    }
  }

  // Thêm mới hoặc Cập nhật địa chỉ qua API
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const url = editingId ? `/api/addresses/${editingId}` : "/api/addresses";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientName, phone, fullAddress, isDefault }),
      });

      const result = await res.json();
      if (result.success) {
        setShowModal(false);
        resetForm();
        fetchAddresses();
      } else {
        alert(result.error?.message || "Không thể lưu địa chỉ");
      }
    } catch (error) {
      console.error("Lỗi khi lưu địa chỉ:", error);
      alert("Lỗi kết nối máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Xóa địa chỉ qua API DELETE
  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        fetchAddresses();
      } else {
        alert(result.error?.message || "Không thể xóa địa chỉ");
      }
    } catch (error) {
      console.error("Lỗi khi xóa địa chỉ:", error);
      alert("Lỗi kết nối");
    }
  }

  // Đặt địa chỉ mặc định bằng cách gọi PATCH /api/addresses/[id] với isDefault: true
  async function handleSetDefault(addr: Address) {
    try {
      const res = await fetch(`/api/addresses/${addr.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isDefault: true,
        }),
      });

      const result = await res.json();
      if (result.success) {
        fetchAddresses();
      } else {
        alert(result.error?.message || "Không thể đặt địa chỉ mặc định");
      }
    } catch (error) {
      console.error("Lỗi khi đặt địa chỉ mặc định:", error);
      alert("Lỗi kết nối máy chủ");
    }
  }

  function resetForm() {
    setEditingId(null);
    setRecipientName("");
    setPhone("");
    setFullAddress("");
    setIsDefault(false);
  }

  function openEdit(addr: Address) {
    setEditingId(addr.id);
    setRecipientName(addr.recipientName);
    setPhone(addr.phone);
    setFullAddress(addr.fullAddress);
    setIsDefault(addr.isDefault);
    setShowModal(true);
  }

  if (loading && addresses.length === 0) {
    return (
      <div className="flex items-center justify-center py-6 text-gray-500 gap-2">
        <Loader2 size={16} className="animate-spin text-[#164F8D]" />
        <span className="text-xs">Đang tải địa chỉ...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium text-gray-700">Danh sách địa chỉ nhận hàng</span>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-[#164F8D] hover:bg-[#123d6d] text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus size={14} />
          <span>Thêm địa chỉ</span>
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-xs border border-dashed border-gray-200 rounded-lg">
          Chưa có địa chỉ nào được lưu.
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-3 rounded-lg border text-sm transition-all ${
                addr.isDefault ? "border-[#164F8D] bg-blue-50/20 shadow-xs" : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="flex items-center gap-2 font-semibold text-gray-800 text-xs md:text-sm">
                    <MapPin size={14} className="text-[#164F8D] shrink-0" />
                    <span>{addr.recipientName}</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-600">{addr.phone}</span>
                    {addr.isDefault && (
                      <span className="text-[10px] bg-[#164F8D] text-white px-1.5 py-0.5 rounded font-medium">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-xs mt-1.5 pl-5">{addr.fullAddress}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!addr.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr)}
                      className="text-[11px] text-[#164F8D] hover:underline px-1 py-1 cursor-pointer font-medium"
                    >
                      Đặt mặc định
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openEdit(addr)}
                    className="p-1.5 text-gray-500 hover:text-[#164F8D] hover:bg-gray-100 rounded cursor-pointer transition-colors"
                    title="Sửa địa chỉ"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(addr.id)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors"
                    title="Xóa địa chỉ"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Thêm / Sửa địa chỉ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold text-base text-[#164F8D] mb-4 pb-2 border-b">
              {editingId ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tên người nhận</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Nhập tên người nhận"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#164F8D] focus:ring-1 focus:ring-[#164F8D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Nhập số điện thoại"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#164F8D] focus:ring-1 focus:ring-[#164F8D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Địa chỉ cụ thể</label>
                <textarea
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#164F8D] focus:ring-1 focus:ring-[#164F8D]"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modalIsDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-gray-300 text-[#164F8D] focus:ring-[#164F8D] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="modalIsDefault" className="text-xs text-gray-700 font-medium cursor-pointer">
                  Đặt làm địa chỉ mặc định
                </label>
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
                  <span>{isSubmitting ? "Đang lưu..." : "Lưu địa chỉ"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}