// src/app/account/paymentmethods/page.tsx
import { auth } from "@clerk/nextjs/server";
import PaymentMethodManager from "@/src/components/PaymentMethodManager";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function PaymentMethodsPage() {
  await auth.protect();

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#164F8D] transition-colors mb-3"
        >
          <ArrowLeft size={14} />
          <span>Quay lại thông tin tài khoản</span>
        </Link>
        <h1 className="text-2xl font-bold text-[#164F8D]">Tài khoản & Thẻ ngân hàng</h1>
      </div>

      <PaymentMethodManager />
    </main>
  );
}