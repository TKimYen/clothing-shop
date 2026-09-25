// src/app/collections/page.tsx
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const collections = [
  {
    id: 1,
    title: 'Urban Streetwear 2026',
    subtitle: 'Năng động, cá tính & phóng khoáng',
    description: 'Bộ sưu tập dành riêng cho giới trẻ yêu thích sự phá cách với các thiết kế hoodie, áo khoác dù và quần nỉ form rộng.',
    img: '/images/hoodie_1.png',
    tag: 'Mới nhất',
  },
  {
    id: 2,
    title: 'Minimalist Basic',
    subtitle: 'Đơn giản tạo nên phong cách',
    description: 'Tập trung vào các dòng áo thun cotton 100% thoáng mát, màu sắc trung tính, dễ dàng phối hợp trong mọi hoàn cảnh.',
    img: '/images/t_shirt_1.png',
    tag: 'Bán chạy',
  },
  {
    id: 3,
    title: 'Summer Vibes Collection',
    subtitle: 'Thoải mái tận hưởng mùa hè',
    description: 'Những items nhẹ nhàng, năng động kèm theo các phụ kiện nón lưỡi trai trẻ trung cho chuyến hành trình của bạn.',
    img: '/images/cap_1.png',
    tag: 'Xu hướng',
  },
];

export default function CollectionsPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      {/* Tiêu đề trang */}
      <div className="text-center max-w-xl mx-auto mb-12">
        <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold bg-gray-100 px-3 py-1 rounded-full">
          Lookbook & Phong cách
        </span>
        <h1 className="text-3xl md:text-4xl font-bold text-[#164F8D] mt-3 mb-3">
          Bộ sưu tập BlueWear
        </h1>
        <p className="text-gray-600 text-sm">
          Khám phá các dòng sản phẩm được tuyển chọn riêng biệt theo từng xu hướng thời trang mới nhất.
        </p>
      </div>

      {/* Danh sách các bộ sưu tập được thu nhỏ gọn gàng */}
      <div className="space-y-10">
        {collections.map((item, index) => (
          <div 
            key={item.id} 
            className={`flex flex-col md:flex-row gap-6 items-center bg-[#eff6ff]/40 rounded-2xl p-6 border border-gray-100 shadow-sm ${
              index % 2 === 1 ? 'md:flex-row-reverse' : ''
            }`}
          >
            {/* Hình ảnh được thu nhỏ kích thước (w-full md:w-2/5) */}
            <div className="w-full md:w-2/5 rounded-xl overflow-hidden aspect-[4/3] bg-gray-100 relative group">
              <img 
                src={item.img} 
                alt={item.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-3 left-3 bg-[#17579B] text-white text-[11px] px-2.5 py-0.5 rounded-full font-medium shadow">
                {item.tag}
              </span>
            </div>

            {/* Nội dung thông tin cân đối */}
            <div className="w-full md:w-3/5 space-y-3">
              <p className="text-xs font-semibold text-[#17579B] uppercase tracking-wider">{item.subtitle}</p>
              <h2 className="text-2xl font-bold text-[#164F8D]">{item.title}</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                {item.description}
              </p>
              <div className="pt-1">
                <Link 
                  href="/products" 
                  className="inline-flex items-center gap-2 bg-[#17579B] text-white px-5 py-2.5 rounded-full font-medium hover:opacity-90 transition-colors shadow-sm text-xs"
                >
                  <span>Xem sản phẩm</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}