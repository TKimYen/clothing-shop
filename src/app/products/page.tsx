// src/app/products/page.tsx
'use client';

import { Heart, Filter, Search, ShoppingCart } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
};

type VariantItem = {
  id: string;
  sku: string;
  stockQuantity: number;
};

type ProductItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  images: Array<{
    id: string;
    url: string;
    altText: string | null;
    sortOrder: number;
    colorId: string | null;
  }>;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  variants: VariantItem[];
};

type ProductsResponse = {
  success: boolean;
  data: ProductItem[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    sort: string;
  };
  error?: {
    message: string;
  };
};

type CategoriesResponse = {
  success: boolean;
  data: CategoryItem[];
  error?: {
    message: string;
  };
};

type SortValue = 'newest' | 'price_asc' | 'price_desc' | 'name_asc';

const sortOptions: Array<{ label: string; value: SortValue }> = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Giá: Thấp đến cao', value: 'price_asc' },
  { label: 'Giá: Cao đến thấp', value: 'price_desc' },
  { label: 'Tên: A - Z', value: 'name_asc' },
];

function formatPrice(value: number) {
  return `${value.toLocaleString('vi-VN')}đ`;
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [collectionFilter, setCollectionFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [sortValue, setSortValue] = useState<SortValue>('newest');

  // State quản lý phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Lắng nghe sự thay đổi của searchParams trên URL để đồng bộ tự động vào state
  useEffect(() => {
    const collection = searchParams.get('collection')?.trim() || '';
    const category = searchParams.get('category')?.trim() || 'all';
    const sort = searchParams.get('sort')?.trim() as SortValue | null;
    const search = searchParams.get('search') ?? searchParams.get('q') ?? '';
    const minPrice = searchParams.get('minPrice') ?? '';
    const maxPrice = searchParams.get('maxPrice') ?? '';
    const pageParam = Number(searchParams.get('page')) || 1;

    setCollectionFilter(collection);
    setSelectedCategorySlug(category);
    if (sort && sortOptions.some((option) => option.value === sort)) {
      setSortValue(sort);
    }
    setKeyword(search);
    setMinPriceInput(minPrice);
    setMaxPriceInput(maxPrice);
    setCurrentPage(pageParam);
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams();

    if (selectedCategorySlug !== 'all') {
      params.set('category', selectedCategorySlug);
    }
    if (collectionFilter) {
      params.set('collection', collectionFilter);
    }
    if (keyword.trim()) {
      params.set('search', keyword.trim());
    }
    if (minPriceInput.trim()) {
      params.set('minPrice', minPriceInput.trim());
    }
    if (maxPriceInput.trim()) {
      params.set('maxPrice', maxPriceInput.trim());
    }
    if (sortValue !== 'newest') {
      params.set('sort', sortValue);
    }
    if (currentPage > 1) {
      params.set('page', String(currentPage));
    }

    const url = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    const isSameUrl = window.location.pathname === new URL(url, window.location.origin).pathname && window.location.search === new URL(url, window.location.origin).search;
    if (!isSameUrl) {
      window.history.replaceState({}, '', url);
    }
  }, [selectedCategorySlug, collectionFilter, keyword, minPriceInput, maxPriceInput, sortValue, currentPage]);

  useEffect(() => {
    let isActive = true;

    async function loadCategories() {
      const response = await fetch('/api/categories', { cache: 'no-store' });
      const result = (await response.json()) as CategoriesResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? 'Không thể tải danh mục');
      }

      if (!isActive) return;
      setCategories(result.data);
    }

    loadCategories().catch((error: unknown) => {
      if (!isActive) return;
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải danh mục');
    });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadProducts() {
      setIsLoading(true);
      setErrorMessage(null);

      const normalizedMin = minPriceInput.trim();
      const normalizedMax = maxPriceInput.trim();

      if (normalizedMin && Number.isNaN(Number(normalizedMin))) {
        throw new Error('Giá tối thiểu không hợp lệ');
      }

      if (normalizedMax && Number.isNaN(Number(normalizedMax))) {
        throw new Error('Giá tối đa không hợp lệ');
      }

      if (normalizedMin && normalizedMax && Number(normalizedMin) > Number(normalizedMax)) {
        throw new Error('Giá tối thiểu phải nhỏ hơn hoặc bằng giá tối đa');
      }

      const params = new URLSearchParams({
        sort: sortValue,
        limit: '12',
        page: String(currentPage),
      });

      const trimmedKeyword = keyword.trim();
      if (trimmedKeyword) {
        params.set('search', trimmedKeyword);
      }
      if (selectedCategorySlug !== 'all') {
        params.set('category', selectedCategorySlug);
      }
      if (collectionFilter) {
        params.set('collection', collectionFilter);
      }
      if (normalizedMin) {
        params.set('minPrice', normalizedMin);
      }
      if (normalizedMax) {
        params.set('maxPrice', normalizedMax);
      }

      const response = await fetch(`/api/products?${params.toString()}`, {
        cache: 'no-store',
      });
      const result = (await response.json()) as ProductsResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? 'Không thể tải sản phẩm');
      }

      if (!isActive) return;
      setProducts(result.data);
      if (result.meta) {
        setTotalPages(result.meta.totalPages);
      }
    }

    loadProducts()
      .catch((error: unknown) => {
        if (!isActive) return;
        setErrorMessage(error instanceof Error ? error.message : 'Không thể tải sản phẩm');
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [selectedCategorySlug, sortValue, collectionFilter, keyword, minPriceInput, maxPriceInput, currentPage]);

  const sidebarItems = useMemo(
    () => [
      { key: 'all', label: 'Tất cả sản phẩm' },
      ...categories.map((category) => ({
        key: category.slug,
        label: `${category.name} (${category.productCount})`,
      })),
    ],
    [categories],
  );

  const hasActiveFilters =
    selectedCategorySlug !== 'all' ||
    Boolean(collectionFilter) ||
    Boolean(keyword.trim()) ||
    Boolean(minPriceInput.trim()) ||
    Boolean(maxPriceInput.trim()) ||
    sortValue !== 'newest';

  const resetFilters = () => {
    setSelectedCategorySlug('all');
    setCollectionFilter('');
    setKeyword('');
    setMinPriceInput('');
    setMaxPriceInput('');
    setSortValue('newest');
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#164F8D]">Tất cả sản phẩm</h1>
          <p className="text-gray-500 text-sm mt-1">Khám phá bộ sưu tập thời trang unisex mới nhất tại BlueWear</p>
          {collectionFilter ? (
            <p className="text-xs text-[#17579B] mt-2">Đang lọc theo bộ sưu tập: {collectionFilter}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sắp xếp:</span>
          <select
            value={sortValue}
            onChange={(event) => {
              setSortValue(event.target.value as SortValue);
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#17579B] text-gray-700"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
        <div className="flex flex-col xl:flex-row gap-3">
          <div className="relative xl:flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 outline-none focus:border-[#17579B]"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              value={minPriceInput}
              onChange={(event) => {
                setMinPriceInput(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Giá tối thiểu"
              className="w-32 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#17579B]"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              min="0"
              value={maxPriceInput}
              onChange={(event) => {
                setMaxPriceInput(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Giá tối đa"
              className="w-32 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#17579B]"
            />
          </div>
        </div>

        {hasActiveFilters ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-medium text-[#17579B] hover:text-[#0e3b6d]"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="hidden lg:block bg-gray-50 p-6 rounded-xl h-fit border border-gray-100">
          <div className="flex items-center gap-2 font-bold text-[#164F8D] mb-4 pb-2 border-b">
            <Filter size={18} />
            <span>Danh mục sản phẩm</span>
          </div>
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategorySlug(item.key);
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategorySlug === item.key
                      ? 'bg-[#17579B] text-white font-medium'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-3">
          {errorMessage ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-6">
              {errorMessage}
            </div>
          ) : null}

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-100 aspect-[3/4] mb-3 rounded-md" />
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-10 text-center text-gray-600">
              Không có sản phẩm phù hợp.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {products.map((product) => {
                  const image = product.images[0];
                  const displayPrice = product.salePrice ?? product.price;

                  return (
                    <div key={product.id} className="group relative cursor-pointer">
                      {/* Khung ảnh + Nút hover thêm vào giỏ hàng */}
                      <div className="relative bg-gray-100 aspect-[3/4] mb-3 overflow-hidden rounded-md">
                        <Link href={`/products/${product.slug}`}>
                          <img
                            src={image?.url ?? '/images/t_shirt_1.png'}
                            alt={image?.altText ?? product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </Link>

                        {/* Nút yêu thích */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                          }}
                          className="absolute top-3 right-3 p-1.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:text-red-500"
                        >
                          <Heart size={18} />
                        </button>

                        <span className="absolute bottom-3 left-3 bg-white/90 text-xs px-2 py-1 rounded text-gray-700 font-medium">
                          {product.category.name}
                        </span>

                        {/* NÚT THÊM NHANH VÀO GIỎ HÀNG NỐI VỚI DB */}
                        <div className="absolute inset-x-3 bottom-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              const defaultVariant = product.variants?.[0];
                              if (!defaultVariant) {
                                alert('Sản phẩm tạm thời hết phân loại!');
                                return;
                              }

                              try {
                                const response = await fetch('/api/cart', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    variantId: defaultVariant.id,
                                    quantity: 1,
                                  }),
                                });
                                const result = await response.json();
                                if (result.success) {
                                  alert(`Đã thêm sản phẩm "${product.name}" vào giỏ hàng!`);
                                  window.location.reload();
                                } else {
                                  alert(result.error || 'Không thể thêm vào giỏ hàng');
                                }
                              } catch (err) {
                                console.error(err);
                                alert('Lỗi kết nối giỏ hàng');
                              }
                            }}
                            className="w-full bg-[#164F8D] hover:bg-[#123d6d] text-white text-sm font-medium py-2.5 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 transition-colors"
                          >
                            <ShoppingCart size={16} />
                            <span>Thêm vào giỏ</span>
                          </button>
                        </div>
                      </div>

                      {/* Tên sản phẩm dẫn tới trang chi tiết */}
                      <Link href={`/products/${product.slug}`} className="block">
                        <h3 className="text-sm text-gray-700 mb-1 line-clamp-1 group-hover:text-[#164F8D] transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[#164F8D]">{formatPrice(displayPrice)}</p>
                        {product.salePrice !== null ? (
                          <p className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* PAGINATION UI */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm border rounded-lg border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Trang trước
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, index) => {
                      const pageNum = index + 1;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-9 h-9 text-sm rounded-lg font-medium transition-colors ${
                            currentPage === pageNum
                              ? 'bg-[#164F8D] text-white'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm border rounded-lg border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Trang sau
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}