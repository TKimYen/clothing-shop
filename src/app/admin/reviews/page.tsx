// src/app/admin/reviews/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Star, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";

type ReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  product: {
    name: string;
    slug: string;
  };
  user: {
    fullName: string;
    email: string;
  };
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch("/api/admin/reviews", { cache: "no-store" });
        const result = await res.json();
        if (result.success) {
          setReviews(result.data);
        } else {
          toast.error(result.error?.message || "Không thể tải danh sách đánh giá");
        }
      } catch (error) {
        console.error("Lỗi kết nối:", error);
        toast.error("Lỗi kết nối đến server");
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Đánh giá sản phẩm</h1>
          <p className="text-sm text-gray-500 mt-1">Xem và kiểm duyệt đánh giá từ phía khách hàng.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20 gap-2 text-gray-500">
            <Loader2 className="animate-spin text-[#164F8D]" size={20} />
            <span className="text-xs">Đang tải danh sách đánh giá...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <MessageSquare size={40} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-medium">Chưa có đánh giá nào trên hệ thống</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-semibold">
                  <th className="p-4">Khách hàng</th>
                  <th className="p-4">Sản phẩm</th>
                  <th className="p-4">Số sao</th>
                  <th className="p-4">Nội dung nhận xét</th>
                  <th className="p-4">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {reviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-medium">
                      <p className="text-gray-900">{rev.user?.fullName || "Ẩn danh"}</p>
                      <p className="text-[11px] text-gray-400">{rev.user?.email}</p>
                    </td>
                    <td className="p-4 font-semibold text-[#164F8D]">
                      {rev.product?.name || "Sản phẩm đã xóa"}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-yellow-400">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} size={14} className="fill-yellow-400" />
                        ))}
                        <span className="ml-1 font-bold text-gray-700">{rev.rating}/5</span>
                      </div>
                    </td>
                    <td className="p-4 max-w-xs truncate text-gray-600">
                      {rev.comment || <span className="italic text-gray-400">Không có nhận xét chi tiết</span>}
                    </td>
                    <td className="p-4 text-gray-500">
                      {new Date(rev.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}