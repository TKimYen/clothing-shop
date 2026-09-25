'use client';

import { Heart, Filter, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const collection = params.get('collection')?.trim();
    const category = params.get('category')?.trim();
    const sort = params.get('sort')?.trim() as SortValue | null;
    const search = params.get('search') ?? params.get('q') ?? '';
    const minPrice = params.get('minPrice') ?? '';
    const maxPrice = params.get('maxPrice') ?? '';

    if (collection) setCollectionFilter(collection);
    if (category) setSelectedCategorySlug(category);
    if (sort && sortOptions.some((option) => option.value === sort)) {
      setSortValue(sort);
    }
    setKeyword(search);
    setMinPriceInput(minPrice);
    setMaxPriceInput(maxPrice);
  }, []);

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

    const url = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    const isSameUrl = window.location.pathname === new URL(url, window.location.origin).pathname && window.location.search === new URL(url, window.location.origin).search;
    if (!isSameUrl) {
      window.history.replaceState({}, '', url);
    }
  }, [selectedCategorySlug, collectionFilter, keyword, minPriceInput, maxPriceInput, sortValue]);

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
        limit: '24',
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
  }, [selectedCategorySlug, sortValue, collectionFilter, keyword, minPriceInput, maxPriceInput]);

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
            onChange={(event) => setSortValue(event.target.value as SortValue)}
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
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 outline-none focus:border-[#17579B]"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              value={minPriceInput}
              onChange={(event) => setMinPriceInput(event.target.value)}
              placeholder="Giá tối thiểu"
              className="w-32 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#17579B]"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              min="0"
              value={maxPriceInput}
              onChange={(event) => setMaxPriceInput(event.target.value)}
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
                  onClick={() => setSelectedCategorySlug(item.key)}
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
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((product) => {
                const image = product.images[0];
                const displayPrice = product.salePrice ?? product.price;

                return (
                  <div key={product.id} className="group cursor-pointer">
                    <div className="relative bg-gray-100 aspect-[3/4] mb-3 overflow-hidden rounded-md">
                      <img
                        src={image?.url ?? '/images/t_shirt_1.png'}
                        alt={image?.altText ?? product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <button type="button" className="absolute top-3 right-3 p-1.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:text-red-500">
                        <Heart size={18} />
                      </button>
                      <span className="absolute bottom-3 left-3 bg-white/90 text-xs px-2 py-1 rounded text-gray-700 font-medium">
                        {product.category.name}
                      </span>
                    </div>
                    <h3 className="text-sm text-gray-700 mb-1 line-clamp-1">{product.name}</h3>
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
          )}
        </div>
      </div>
    </div>
  );
}
