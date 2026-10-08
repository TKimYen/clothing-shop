// src/app/account/page.tsx
import { auth } from "@clerk/nextjs/server";
import ProfileForm from "@/src/components/ProfileForm";
import AddressManager from "@/src/components/AddressManager";

export default async function AccountPage() {
  await auth.protect();

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-[#164F8D] mb-8">Thông tin tài khoản</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Phần 1: Hồ sơ cá nhân (Dùng component sẵn có của nhóm) */}
        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">Hồ sơ cá nhân</h2>
          <ProfileForm />
        </section>

        {/* Phần 2: Sổ địa chỉ giao hàng */}
        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">Sổ địa chỉ giao hàng</h2>
          <AddressManager />
        </section>
      </div>
    </main>
  );
}