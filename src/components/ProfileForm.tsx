// src/components/ProfileForm.tsx
"use client";

import { FormEvent, useEffect, useState } from "react";
import { User, Mail, Phone, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type Profile = {
  fullName: string;
  email: string;
  phone: string | null;
};

export default function ProfileForm() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        await fetch("/api/profile/sync", {
          method: "POST",
        });

        const response = await fetch("/api/profile");
        const result = await response.json();

        if (!result.success) {
          setMessage({ type: "error", text: result.error?.message || "Không thể tải thông tin" });
          return;
        }

        const data = result.data;
        setProfile(data);
        setFullName(data.fullName ?? "");
        setPhone(data.phone ?? "");
      } catch (error) {
        console.error(error);
        setMessage({ type: "error", text: "Không thể tải thông tin tài khoản" });
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          phone,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setMessage({ type: "error", text: result.error?.message || "Cập nhật thất bại" });
        return;
      }

      setProfile(result.data);
      setFullName(result.data.fullName ?? "");
      setPhone(result.data.phone ?? "");
      setMessage({ type: "success", text: "Cập nhật thông tin thành công!" });
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Có lỗi xảy ra khi cập nhật" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-500 gap-2">
        <Loader2 size={18} className="animate-spin text-[#164F8D]" />
        <span className="text-sm">Đang tải thông tin...</span>
      </div>
    );
  }

  if (!profile) {
    return <p className="text-sm text-red-500 py-4">{message?.text || "Không tìm thấy thông tin tài khoản."}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Họ và tên */}
      <div>
        <label htmlFor="fullName" className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
          <User size={14} className="text-[#164F8D]" />
          <span>Họ và tên</span>
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Nhập họ và tên"
          required
          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#164F8D] focus:ring-1 focus:ring-[#164F8D] transition-all"
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
          <Mail size={14} className="text-[#164F8D]" />
          <span>Email</span>
        </label>
        <input
          id="email"
          type="email"
          value={profile.email}
          disabled
          className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
        />
        <p className="text-[11px] text-gray-400 mt-1">Email được quản lý bảo mật bởi hệ thống Clerk.</p>
      </div>

      {/* Số điện thoại */}
      <div>
        <label htmlFor="phone" className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
          <Phone size={14} className="text-[#164F8D]" />
          <span>Số điện thoại</span>
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Nhập số điện thoại"
          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#164F8D] focus:ring-1 focus:ring-[#164F8D] transition-all"
        />
      </div>

      {/* Nút lưu thay đổi */}
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-[#164F8D] hover:bg-[#123d6d] text-white text-sm font-medium py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
      >
        {saving && <Loader2 size={16} className="animate-spin" />}
        <span>{saving ? "Đang lưu..." : "Lưu thay đổi"}</span>
      </button>
    </form>
  );
}