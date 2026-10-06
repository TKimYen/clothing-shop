"use client";

import { FormEvent, useEffect, useState } from "react";

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
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        // Đảm bảo Clerk user đã được tạo trong Prisma
        await fetch("/api/profile/sync", {
          method: "POST",
        });

        const response = await fetch("/api/profile");
        const result = await response.json();

        if (!result.success) {
          setMessage(result.error?.message || "Không thể tải thông tin");
          return;
        }

        const data = result.data;

        setProfile(data);
        setFullName(data.fullName ?? "");
        setPhone(data.phone ?? "");
      } catch (error) {
        console.error(error);
        setMessage("Không thể tải thông tin tài khoản");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

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
        setMessage(result.error?.message || "Cập nhật thất bại");
        return;
      }

      setProfile(result.data);
      setFullName(result.data.fullName ?? "");
      setPhone(result.data.phone ?? "");
      setMessage("Cập nhật thông tin thành công!");
    } catch (error) {
      console.error(error);
      setMessage("Có lỗi xảy ra khi cập nhật");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p>Đang tải thông tin...</p>;
  }

  if (!profile) {
    return <p>{message || "Không tìm thấy thông tin tài khoản."}</p>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="fullName">Họ và tên</label>

        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Nhập họ và tên"
          required
        />
      </div>

      <div>
        <label htmlFor="email">Email</label>

        <input id="email" type="email" value={profile.email} disabled />

        <small>Email được quản lý bởi Clerk.</small>
      </div>

      <div>
        <label htmlFor="phone">Số điện thoại</label>

        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Nhập số điện thoại"
        />
      </div>

      <button type="submit" disabled={saving}>
        {saving ? "Đang lưu..." : "Lưu thay đổi"}
      </button>

      {message && <p>{message}</p>}
    </form>
  );
}
