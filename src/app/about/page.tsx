// src/app/about/page.tsx
import { Sparkles, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Tiêu đề chính */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#17579B] bg-blue-50 px-3 py-1 rounded-full">
          Về chúng tôi
        </span>
        <h1 className="text-3xl md:text-4xl font-bold text-[#164F8D] mt-3 mb-4">
          BlueWear - Phong cách thời trang Unisex hiện đại
        </h1>
        <p className="text-gray-600 text-sm md:text-base leading-relaxed">
          Được thành lập với đam mê mang lại sự tự do và thoải mái trong từng trang phục, BlueWear định hình phong cách thời trang phi giới tính năng động, trẻ trung cho thế hệ trẻ.
        </p>
      </div>

      {/* Phần hình ảnh minh họa / Banner giới thiệu */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-16">
        <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-[4/3] shadow-sm">
          <img 
            src="/images/t_shirt_1.png" 
            alt="BlueWear Studio" 
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">Sứ mệnh & Giá trị cốt lõi</h2>
          <p className="text-gray-600 text-sm md:text-base leading-relaxed">
            Chúng tôi tin rằng trang phục không có ranh giới giới tính. Mỗi thiết kế của BlueWear đều chú trọng vào chất liệu vải cao cấp thoáng mát, phom dáng rộng rãi (oversized) chuẩn streetwear và độ bền vượt trội theo thời gian.
          </p>
          <div className="flex items-center gap-3 pt-2 text-[#164F8D] font-medium text-sm">
            <Sparkles size={20} />
            <span>Thiết kế tối giản - Tự tin thể hiện cá tính riêng</span>
          </div>
        </div>
      </div>

      {/* Cam kết dịch vụ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 bg-gray-50 p-8 rounded-2xl border border-gray-100">
        <div className="flex flex-col items-center text-center p-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-[#17579B] flex items-center justify-center mb-3">
            <ShieldCheck size={24} />
          </div>
          <h3 className="font-bold text-gray-800 mb-1">Chất lượng đảm bảo</h3>
          <p className="text-xs text-gray-500">100% sản phẩm kiểm định kỹ lưỡng trước khi đến tay khách hàng.</p>
        </div>

        <div className="flex flex-col items-center text-center p-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-[#17579B] flex items-center justify-center mb-3">
            <Truck size={24} />
          </div>
          <h3 className="font-bold text-gray-800 mb-1">Giao hàng nhanh chóng</h3>
          <p className="text-xs text-gray-500">Miễn phí vận chuyển cho các đơn hàng từ 600.000đ trên toàn quốc.</p>
        </div>

        <div className="flex flex-col items-center text-center p-4 sm:col-span-2 lg:col-span-1">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-[#17579B] flex items-center justify-center mb-3">
            <RefreshCw size={24} />
          </div>
          <h3 className="font-bold text-gray-800 mb-1">Đổi trả dễ dàng</h3>
          <p className="text-xs text-gray-500">Hỗ trợ đổi size/mẫu trong vòng 7 ngày cực kỳ linh hoạt.</p>
        </div>
      </div>
    </div>
  );
}