'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

type CollectionItem = {
  id: string;
  name: string;
  slug: string;
  season: 'SPRING_SUMMER' | 'FALL_WINTER';
  year: number;
  description: string | null;
  bannerUrl: string | null;
  startsAt: string | null;
  productCount: number;
};

type CollectionsResponse = {
  success: boolean;
  data: CollectionItem[];
  error?: {
    message: string;
  };
};

function getSeasonLabel(season: CollectionItem['season']) {
  if (season === 'SPRING_SUMMER') {
    return 'Xuân Hè';
  }

  return 'Thu Đông';
}

function getTagLabel(collection: CollectionItem) {
  if (collection.productCount >= 5) {
    return 'Nổi bật';
  }

  if (collection.startsAt) {
    const startsAt = new Date(collection.startsAt);
    const daysFromStart = (Date.now() - startsAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysFromStart <= 45) {
      return 'Mới nhất';
    }
  }

  return 'Đang mở bán';
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadCollections() {
      setIsLoading(true);
      setErrorMessage(null);

      const response = await fetch('/api/collections', { cache: 'no-store' });
      const result = (await response.json()) as CollectionsResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? 'Không thể tải bộ sưu tập');
      }

      if (!isActive) {
        return;
      }

      setCollections(result.data);
    }

    loadCollections()
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : 'Không thể tải bộ sưu tập',
        );
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
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

      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-6">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-10">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse flex flex-col md:flex-row gap-6 items-center bg-[#eff6ff]/40 rounded-2xl p-6 border border-gray-100"
            >
              <div className="w-full md:w-2/5 rounded-xl aspect-[4/3] bg-gray-200" />
              <div className="w-full md:w-3/5 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-7 bg-gray-200 rounded w-2/3" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
                <div className="h-9 bg-gray-200 rounded w-36" />
              </div>
            </div>
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-10 text-center text-gray-600">
          Chưa có bộ sưu tập đang hoạt động.
        </div>
      ) : (
        <div className="space-y-10">
          {collections.map((item, index) => (
            <div
              key={item.id}
              className={`flex flex-col md:flex-row gap-6 items-center bg-[#eff6ff]/40 rounded-2xl p-6 border border-gray-100 shadow-sm ${
                index % 2 === 1 ? 'md:flex-row-reverse' : ''
              }`}
            >
              <div className="w-full md:w-2/5 rounded-xl overflow-hidden aspect-[4/3] bg-gray-100 relative group">
                <img
                  src={item.bannerUrl ?? '/images/banner.png'}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-[#17579B] text-white text-[11px] px-2.5 py-0.5 rounded-full font-medium shadow">
                  {getTagLabel(item)}
                </span>
              </div>

              <div className="w-full md:w-3/5 space-y-3">
                <p className="text-xs font-semibold text-[#17579B] uppercase tracking-wider">
                  {getSeasonLabel(item.season)} {item.year} • {item.productCount} sản phẩm
                </p>
                <h2 className="text-2xl font-bold text-[#164F8D]">{item.name}</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {item.description ?? 'Bộ sưu tập mới với phong cách hiện đại, phù hợp cho mọi cá tính.'}
                </p>
                <div className="pt-1">
                  <Link
                    href={`/products?collection=${item.slug}`}
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
      )}
    </div>
  );
}
