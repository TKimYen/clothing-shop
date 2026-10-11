"use client";

import { RefreshCw } from "lucide-react";

export default function ProductDetailError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <main className="container mx-auto px-4 py-20 text-center">
      <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-8">
        <h1 className="text-xl font-bold text-red-800">Không thể tải sản phẩm</h1>
        <p className="mt-2 text-sm text-red-700">Vui lòng thử lại hoặc quay về danh sách sản phẩm.</p>
        <button type="button" onClick={reset} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#17579B] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          <RefreshCw size={16} /> Thử lại
        </button>
      </div>
    </main>
  );
}
