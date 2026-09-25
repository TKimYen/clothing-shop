// src/app/page.tsx
import { Heart } from 'lucide-react';
import Link from 'next/link';

const mockProducts = [
  { id: 1, name: 'Áo thun Unisex', price: '299.000đ', img: '/images/t_shirt_1.png' },
  { id: 2, name: 'Áo hoodie Unisex', price: '499.000đ', img: '/images/hoodie_1.png' },
  { id: 3, name: 'Áo khoác chất liệu dù', price: '699.000đ', img: '/images/jacket_1.png' },
  { id: 4, name: 'Quần nỉ hai da sọc chéo', price: '399.000đ', img: '/images/pants_1.png' },
  { id: 5, name: 'Nón lưỡi trai', price: '199.000đ', img: '/images/cap_1.png' },
  { id: 6, name: 'Áo thun form rộng chất cottom', price: '299.000đ', img: '/images/t_shirt_2.png' },
  { id: 7, name: 'Áo thun 100% cotton form rộng', price: '499.000đ', img: '/images/t_shirt_3.png' },
];

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="container mx-auto px-4 mt-6">
        <div className="relative rounded-2xl overflow-hidden min-h-[450px] flex items-center bg-[#eff6ff]">

          {/* Thêm pointer-events-none để lớp nền không che mất thao tác click chuột */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img
              src="/images/banner.png"
              alt="BlueWear Banner"
              className="w-full h-full object-cover object-right"
            />
            <div className="absolute inset-y-0 left-0 w-full md:w-3/5 bg-gradient-to-r from-[#eff6ff] via-[#eff6ff]/90 to-transparent"></div>
          </div>

          {/* Nội dung chữ và nút bấm nằm ở lớp trên cùng (z-10) */}
          <div className="relative z-10 p-10 md:p-16 md:w-1/2">
            <p className="text-sm text-gray-500 uppercase tracking-widest mb-2 font-medium">Unisex Clothing</p>
            <h1 className="text-5xl font-bold text-[#164F8D] mb-4 leading-tight">
              Style for<br />everyone
            </h1>
            <p className="text-gray-600 mb-8 text-lg">
              Thời trang unisex - đơn giản, thoải mái, phù hợp với mọi cá tính.
            </p>

            {/* Nút bấm chuyển sang trang sản phẩm */}
            <Link
              href="/products"
              className="inline-block bg-[#17579B] hover:opacity-90 text-white px-8 py-3 rounded-full font-medium transition-colors mb-6 shadow-md cursor-pointer"
            >
              Khám phá ngay →
            </Link>

            <div className="flex gap-2 items-center">
              <span className="h-3 w-3 rounded-full bg-[#17579B]"></span>
              <span className="h-3 w-3 rounded-full bg-[#91B8D9]"></span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex justify-between items-end mb-8 border-b pb-4">
          <h2 className="text-2xl font-bold text-[#164F8D]">Sản phẩm nổi bật</h2>
          <Link href="/products" className="text-[#164F8D] hover:underline text-sm font-medium">
            Xem tất cả →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {mockProducts.map((product) => (
            <div key={product.id} className="group cursor-pointer">
              <div className="relative bg-gray-100 aspect-[3/4] mb-3 overflow-hidden rounded-md">
                <img
                  src={product.img}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button className="absolute top-3 right-3 p-1.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:text-red-500">
                  <Heart size={18} />
                </button>
              </div>
              <h3 className="text-sm text-gray-700 mb-1 line-clamp-1">{product.name}</h3>
              <p className="font-semibold text-[#164F8D]">{product.price}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}