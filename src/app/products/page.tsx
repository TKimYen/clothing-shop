// src/app/products/page.tsx
import { Heart, Filter } from 'lucide-react';
import Link from 'next/link';

const allProducts = [
  { id: 1, name: 'Áo thun Unisex', price: '299.000đ', category: 'Áo thun', img: '/images/t_shirt_1.png' },
  { id: 2, name: 'Áo hoodie Unisex', price: '499.000đ', category: 'Hoodie', img: '/images/hoodie_1.png' },
  { id: 3, name: 'Áo khoác chất liệu dù', price: '699.000đ', category: 'Áo khoác', img: '/images/jacket_1.png' },
  { id: 4, name: 'Quần nỉ hai da sọc chéo', price: '399.000đ', category: 'Quần', img: '/images/pants_1.png' },
  { id: 5, name: 'Nón lưỡi trai', price: '199.000đ', category: 'Phụ kiện', img: '/images/cap_1.png' },
  { id: 6, name: 'Áo thun form rộng chất cottom', price: '299.000đ', category: 'Áo thun', img: '/images/t_shirt_2.png' },
  { id: 7, name: 'Áo thun 100% cotton form rộng', price: '499.000đ', category: 'Áo thun', img: '/images/t_shirt_3.png' },
];

const categories = ['Tất cả sản phẩm', 'Áo thun', 'Hoodie', 'Áo khoác', 'Quần', 'Phụ kiện'];

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Đã xóa đoạn breadcrumb "Trang chủ > Sản phẩm" theo yêu cầu */}

      {/* Tiêu đề trang */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#164F8D]">Tất cả sản phẩm</h1>
          <p className="text-gray-500 text-sm mt-1">Khám phá bộ sưu tập thời trang unisex mới nhất tại BlueWear</p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sắp xếp:</span>
          <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#17579B] text-gray-700">
            <option>Mới nhất</option>
            <option>Giá: Thấp đến cao</option>
            <option>Giá: Cao đến thấp</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar danh mục */}
        <div className="hidden lg:block bg-gray-50 p-6 rounded-xl h-fit border border-gray-100">
          <div className="flex items-center gap-2 font-bold text-[#164F8D] mb-4 pb-2 border-b">
            <Filter size={18} />
            <span>Danh mục sản phẩm</span>
          </div>
          <ul className="space-y-2">
            {categories.map((cat, index) => (
              <li key={index}>
                <button className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${index === 0 ? 'bg-[#17579B] text-white font-medium' : 'text-gray-600 hover:bg-gray-200'}`}>
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Lưới sản phẩm */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {allProducts.map((product) => (
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
                  <span className="absolute bottom-3 left-3 bg-white/90 text-xs px-2 py-1 rounded text-gray-700 font-medium">
                    {product.category}
                  </span>
                </div>
                <h3 className="text-sm text-gray-700 mb-1 line-clamp-1">{product.name}</h3>
                <p className="font-semibold text-[#164F8D]">{product.price}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}