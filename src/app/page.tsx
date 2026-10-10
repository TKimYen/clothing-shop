// src/app/page.tsx
"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type ProductItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  images: Array<{
    id: string;
    url: string;
    altText: string | null;
  }>;
};

type ProductsResponse = {
  success: boolean;
  data: ProductItem[];
  error?: {
    message: string;
  };
};

type SlideItem = {
  tagline: string;
  title: string;
  description: string;
  buttonLink: string;
  image: string;
};

type CollectionApiItem = {
  name: string;
  slug: string;
  season: string;
  year: number;
  description: string | null;
  bannerUrl: string | null;
};

function formatPrice(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<ProductItem[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);

  // Khởi tạo danh sách slide bắt đầu bằng Banner gốc của website
  const [slides, setSlides] = useState<SlideItem[]>([
    {
      tagline: "UNISEX CLOTHING",
      title: "Style for everyone",
      description: "Thời trang unisex - đơn giản, thoải mái, phù hợp với mọi cá tính.",
      buttonLink: "/products",
      image: "/images/banner.png",
    },
  ]);
  const [currentSlide, setCurrentSlide] = useState(0);

  // 1. Tải thêm các bộ sưu tập từ Database Neon để nối tiếp vào danh sách slide
  useEffect(() => {
    async function fetchCollectionsForBanner() {
      try {
        const res = await fetch('/api/collections');
        const result = await res.json();
        const dataList = result.data || result;
        
        if (Array.isArray(dataList) && dataList.length > 0) {
          const collectionSlides: SlideItem[] = dataList.map((col: CollectionApiItem) => ({
            tagline: `BỘ SƯU TẬP ${col.season} ${col.year}`,
            title: col.name,
            description: col.description || `Khám phá các thiết kế mới nhất trong bộ sưu tập ${col.name}.`,
            buttonLink: `/products?collection=${col.slug}`,
            image: col.bannerUrl || "/images/banner.png",
          }));

          // Giữ banner gốc đầu tiên, sau đó nối tiếp các bộ sưu tập từ DB vào sau
          setSlides((prev) => [prev[0], ...collectionSlides]);
        }
      } catch (error) {
        console.error("Lỗi tải bộ sưu tập cho banner", error);
      }
    }
    fetchCollectionsForBanner();
  }, []);

  // 2. Tự động chuyển slide sau mỗi 10 giây
  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 10000);

    return () => clearInterval(timer);
  }, [slides.length]);

  // 3. Tải danh sách sản phẩm nổi bật
  useEffect(() => {
    let isActive = true;

    async function loadFeaturedProducts() {
      const response = await fetch("/api/products?sort=newest&limit=5", {
        cache: "no-store",
      });
      const result = (await response.json()) as ProductsResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error?.message ?? "Không thể tải sản phẩm nổi bật",
        );
      }

      if (!isActive) {
        return;
      }

      setFeaturedProducts(result.data);
    }

    loadFeaturedProducts()
      .catch((error) => {
        console.error("Failed to load featured products", error);
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingFeatured(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const slide = slides[currentSlide];

  return (
    <>
      {/* BANNER GIỮ NGUYÊN KHUNG GỐC, TỰ ĐỘNG CHUYỂN TỪ BANNER CHÍNH SANG CÁC BỘ SƯU TẬP SAU 10S */}
      <section className="container mx-auto px-4 mt-6">
        <div className="relative rounded-2xl overflow-hidden min-h-[450px] flex items-center bg-[#eff6ff]">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img
              src={slide.image}
              alt="BlueWear Banner"
              className="w-full h-full object-cover object-right transition-opacity duration-700"
            />
            <div className="absolute inset-y-0 left-0 w-full md:w-3/5 bg-gradient-to-r from-[#eff6ff] via-[#eff6ff]/90 to-transparent"></div>
          </div>

          <div className="relative z-10 p-10 md:p-16 md:w-1/2">
            <p className="text-sm text-gray-500 uppercase tracking-widest mb-2 font-medium transition-opacity duration-500">
              {slide.tagline}
            </p>

            <h1 className="text-4xl md:text-5xl font-bold text-[#164F8D] mb-4 leading-tight transition-all duration-500">
              {slide.title}
            </h1>

            <p className="text-gray-600 mb-8 text-base md:text-lg transition-opacity duration-500 line-clamp-2">
              {slide.description}
            </p>

            <Link
              href={slide.buttonLink}
              className="inline-block bg-[#17579B] hover:opacity-90 text-white px-8 py-3 rounded-full font-medium transition-colors mb-6 shadow-md cursor-pointer"
            >
              Khám phá ngay →
            </Link>

            {/* Các chấm tròn chỉ thị và cho phép bấm chuyển thủ công */}
            <div className="flex gap-2 items-center">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-3 rounded-full transition-all duration-300 cursor-pointer ${
                    currentSlide === idx ? "w-8 bg-[#17579B]" : "w-3 bg-[#91B8D9]"
                  }`}
                  aria-label={`Chuyển đến slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PHẦN SẢN PHẨM NỔI BẬT */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex justify-between items-end mb-8 border-b pb-4">
          <h2 className="text-2xl font-bold text-[#164F8D]">
            Sản phẩm nổi bật
          </h2>

          <Link
            href="/products"
            className="text-[#164F8D] hover:underline text-sm font-medium"
          >
            Xem tất cả →
          </Link>
        </div>

        {isLoadingFeatured ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-100 aspect-[3/4] mb-3 rounded-md" />
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {featuredProducts.map((product) => {
              const image = product.images[0];
              const displayPrice = product.salePrice ?? product.price;

              return (
                <div key={product.id} className="group">
                  <div className="relative bg-gray-100 aspect-[3/4] mb-3 overflow-hidden rounded-md">
                    <Link href={`/products/${product.slug}`} className="block h-full">
                      <img
                        src={image?.url ?? "/images/t_shirt_1.png"}
                        alt={image?.altText ?? product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>

                    <button
                      aria-label="Thêm vào yêu thích"
                      className="absolute top-3 right-3 p-1.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:text-red-500"
                    >
                      <Heart size={18} />
                    </button>
                  </div>

                  <Link href={`/products/${product.slug}`}>
                    <h3 className="text-sm text-gray-700 mb-1 line-clamp-1 group-hover:text-[#164F8D] transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[#164F8D]">
                      {formatPrice(displayPrice)}
                    </p>

                    {product.salePrice !== null ? (
                      <p className="text-xs text-gray-400 line-through">
                        {formatPrice(product.price)}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}