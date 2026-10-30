// src/app/orders/review/[productId]/page.tsx
'use client';

import { useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Star, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function WriteReviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const productId = params.productId as string;
  const productName = searchParams.get('name') || 'Sản phẩm';
  const orderId = searchParams.get('orderId') || '';

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, comment, orderId }),
      });
      const result = await res.json();

      if (res.ok && result.success) {
        toast.success('Đã gửi đánh giá thành công!');
        router.push('/orders'); // Gửi xong quay về trang đơn hàng
      } else {
        toast.error(result.error?.message || 'Không thể gửi đánh giá');
      }
    } catch (error) {
      toast.error('Lỗi kết nối mạng');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Link href="/orders" className="inline-flex items-center gap-1.5 text-xs text-[#164F8D] hover:underline font-medium mb-6">
        <ArrowLeft size={16} /> Trở về đơn hàng của tôi
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-xs">
        <h1 className="text-2xl font-bold text-[#164F8D] mb-2">Đánh giá sản phẩm</h1>
        <p className="text-sm font-semibold text-gray-800 mb-6 pb-4 border-b">
          {productName} {orderId && <span className="text-gray-500 font-normal text-xs ml-2">(Đơn hàng: #{orderId})</span>}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Chọn số sao */}
          <div className="flex flex-col items-center justify-center py-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-3">Chất lượng sản phẩm thế nào?</p>
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                >
                  <Star
                    size={38}
                    className={`${
                      (hoverRating || rating) >= star
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-semibold text-[#164F8D] mt-2">
              {rating === 5 && 'Tuyệt vời'}
              {rating === 4 && 'Hài lòng'}
              {rating === 3 && 'Bình thường'}
              {rating === 2 && 'Không hài lòng'}
              {rating === 1 && 'Rất tệ'}
            </span>
          </div>

          {/* Nhập nội dung nhận xét */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Nhận xét chi tiết</label>
            <textarea
              rows={5}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Hãy chia sẻ cảm nhận về chất liệu, form dáng, màu sắc sản phẩm để giúp những người mua khác nhé..."
              className="w-full rounded-xl border border-gray-200 p-4 text-sm outline-none focus:border-[#164F8D] focus:ring-1 focus:ring-[#164F8D]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Link
              href="/orders"
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#164F8D] px-8 py-2.5 text-sm font-medium text-white hover:bg-[#123d6d] disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Hoàn tất đánh giá
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}