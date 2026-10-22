// src/app/products/page.tsx
'use client';

import { Heart, Filter, Search, ShoppingCart, X, Loader2, RefreshCw } from 'lucide-react';
import { Fragment, Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

type ColorItem = {
  id: string;
  name: string;
  hexCode: string;
};

type SizeItem = {
  id: string;
  label: string;
  sortOrder: number;
};

type VariantItem = {
  id: string;
  sku: string;
  stockQuantity: number;
  color: ColorItem;
  size: SizeItem;
};

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
};

type ProductDetail = {
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
  variants?: VariantItem[];
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

// Đọc bộ lọc từ URL
function readParams(searchParams: URLSearchParams) {
  const sort = searchParams.get('sort')?.trim() as SortValue | null;
  return {
    collection: searchParams.get('collection')?.trim() || '',
    category: searchParams.get('category')?.trim() || 'all',
    sort: sort && sortOptions.some((option) => option.value === sort) ? sort : null,
    search: searchParams.get('search') ?? searchParams.get('q') ?? '',
    minPrice: searchParams.get('minPrice') ?? '',
    maxPrice: searchParams.get('maxPrice') ?? '',
    page: Number(searchParams.get('page')) || 1,
  };
}

// useSearchParams() cần nằm trong <Suspense> để Next build được trang này
export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const [initialParams] = useState(() => readParams(searchParams));
  const [collectionFilter, setCollectionFilter] = useState(initialParams.collection);
  const [keyword, setKeyword] = useState(initialParams.search);
  const [minPriceInput, setMinPriceInput] = useState(initialParams.minPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(initialParams.maxPrice);
  const [debouncedKeyword, setDebouncedKeyword] = useState(initialParams.search);
  const [debouncedMinPrice, setDebouncedMinPrice] = useState(initialParams.minPrice);
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState(initialParams.maxPrice);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>(initialParams.category);
  const [sortValue, setSortValue] = useState<SortValue>(initialParams.sort ?? 'newest');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(initialParams.page);
  const [totalPages, setTotalPages] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);

  // State cho Modal Quick Add (chọn nhanh phân loại từ DB)
  const [activeProduct, setActiveProduct] = useState<ProductDetail | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<string>('');
  const [selectedSizeId, setSelectedSizeId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!activeProduct) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveProduct(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeProduct]);

  // Đồng bộ searchParams từ URL (cập nhật ngay khi render, không cần effect)
  const [prevSearchParams, setPrevSearchParams] = useState(searchParams);
  if (searchParams !== prevSearchParams) {
    setPrevSearchParams(searchParams);
    const params = readParams(searchParams);
    setCollectionFilter(params.collection);
    setSelectedCategorySlug(params.category);
    if (params.sort) setSortValue(params.sort);
    setKeyword(params.search);
    setMinPriceInput(params.minPrice);
    setMaxPriceInput(params.maxPrice);
    setCurrentPage(params.page);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedKeyword(keyword);
      setDebouncedMinPrice(minPriceInput);
      setDebouncedMaxPrice(maxPriceInput);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [keyword, minPriceInput, maxPriceInput]);

  // Đồng bộ URL state
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams();
    if (selectedCategorySlug !== 'all') params.set('category', selectedCategorySlug);
    if (collectionFilter) params.set('collection', collectionFilter);
    if (keyword.trim()) params.set('search', keyword.trim());
    if (minPriceInput.trim()) params.set('minPrice', minPriceInput.trim());
    if (maxPriceInput.trim()) params.set('maxPrice', maxPriceInput.trim());
    if (sortValue !== 'newest') params.set('sort', sortValue);
    if (currentPage > 1) params.set('page', String(currentPage));

    const url = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
    const isSameUrl = window.location.pathname === new URL(url, window.location.origin).pathname && window.location.search === new URL(url, window.location.origin).search;
    if (!isSameUrl) {
      window.history.replaceState({}, '', url);
    }
  }, [selectedCategorySlug, collectionFilter, keyword, minPriceInput, maxPriceInput, sortValue, currentPage]);

  // Load Categories
  useEffect(() => {
    let isActive = true;
    async function loadCategories() {
      const response = await fetch('/api/categories', { cache: 'no-store' });
      const result = (await response.json()) as CategoriesResponse;
      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? 'Không thể tải danh mục');
      }
      if (isActive) setCategories(result.data);
    }
    loadCategories().catch((err) => {
      if (isActive) console.error(err);
    });
    return () => { isActive = false; };
  }, []);

  // Load Products
  useEffect(() => {
    let isActive = true;
    async function loadProducts() {
      setIsLoading(true);
      setErrorMessage(null);

      const normalizedMin = debouncedMinPrice.trim();
      const normalizedMax = debouncedMaxPrice.trim();

      if (normalizedMin && Number.isNaN(Number(normalizedMin))) throw new Error('Giá tối thiểu không hợp lệ');
      if (normalizedMax && Number.isNaN(Number(normalizedMax))) throw new Error('Giá tối đa không hợp lệ');
      if (normalizedMin && normalizedMax && Number(normalizedMin) > Number(normalizedMax)) {
        throw new Error('Giá tối thiểu phải nhỏ hơn hoặc bằng giá tối đa');
      }

      const params = new URLSearchParams({
        sort: sortValue,
        limit: '12',
        page: String(currentPage),
      });

      if (debouncedKeyword.trim()) params.set('search', debouncedKeyword.trim());
      if (selectedCategorySlug !== 'all') params.set('category', selectedCategorySlug);
      if (collectionFilter) params.set('collection', collectionFilter);
      if (normalizedMin) params.set('minPrice', normalizedMin);
      if (normalizedMax) params.set('maxPrice', normalizedMax);

      const response = await fetch(`/api/products?${params.toString()}`, { cache: 'no-store' });
      const result = (await response.json()) as ProductsResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? 'Không thể tải sản phẩm');
      }

      if (!isActive) return;
      setProducts(result.data);
      if (result.meta) {
        setTotalPages(result.meta.totalPages);
        if (result.meta.totalPages > 0 && currentPage > result.meta.totalPages) {
          setCurrentPage(result.meta.totalPages);
        }
      }
    }

    loadProducts()
      .catch((err: unknown) => {
        if (isActive) setErrorMessage(err instanceof Error ? err.message : 'Không thể tải sản phẩm');
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => { isActive = false; };
  }, [selectedCategorySlug, sortValue, collectionFilter, debouncedKeyword, debouncedMinPrice, debouncedMaxPrice, currentPage, reloadToken]);

  const sidebarItems = useMemo(
    () => [
      { key: 'all', label: 'Tất cả sản phẩm' },
      ...categories.map((c) => ({ key: c.slug, label: `${c.name} (${c.productCount})` })),
    ],
    [categories]
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

  // Mở Modal và fetch trực tiếp chi tiết sản phẩm từ Database thông qua API slug
  const handleOpenQuickAdd = async (product: ProductItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFetchingDetail(true);

    try {
      const response = await fetch(`/api/products/${product.slug}`, { cache: 'no-store' });
      const result = await response.json();

      if (response.ok && result.success) {
        const fullProduct = result.data as ProductDetail;
        setActiveProduct(fullProduct);
        setQuantity(1);

        const firstVariant = fullProduct.variants?.find((v) => v.stockQuantity > 0) || fullProduct.variants?.[0];
        if (firstVariant) {
          setSelectedColorId(firstVariant.color.id);
          setSelectedSizeId(firstVariant.size.id);
        }
      } else {
        toast.error('Không thể tải thông tin phân loại sản phẩm từ cơ sở dữ liệu');
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi kết nối khi tải phân loại sản phẩm');
    } finally {
      setIsFetchingDetail(false);
    }
  };

  const handleCloseQuickAdd = () => {
    setActiveProduct(null);
  };

  const colorOptions = useMemo(() => {
    if (!activeProduct || !activeProduct.variants) return [];
    return activeProduct.variants.filter(
      (v, index, self) => self.findIndex((item) => item.color.id === v.color.id) === index
    );
  }, [activeProduct]);

  const sizeOptions = useMemo(() => {
    if (!activeProduct || !activeProduct.variants) return [];
    return activeProduct.variants.filter((v) => v.color.id === selectedColorId);
  }, [activeProduct, selectedColorId]);

  const selectedVariant = activeProduct?.variants?.find(
    (v) => v.color.id === selectedColorId && v.size.id === selectedSizeId
  );

  const isSizeAvailable = (sizeId: string) =>
    activeProduct?.variants?.some(
      (v) => v.color.id === selectedColorId && v.size.id === sizeId && v.stockQuantity > 0
    );

  // Thêm vào giỏ hàng kết nối Database qua API /api/cart
  const handleConfirmAddToCart = async () => {
    if (!selectedVariant) {
      toast.error('Vui lòng chọn đầy đủ màu sắc và kích thước');
      return;
    }

    if (selectedVariant.stockQuantity < quantity) {
      toast.error('Số lượng trong kho không đủ');
      return;
    }

    try {
      setIsAdding(true);
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: selectedVariant.id,
          quantity: quantity,
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        window.dispatchEvent(new Event('cart-updated'));
        toast.success(`Đã thêm "${activeProduct?.name}" vào giỏ hàng`);
        handleCloseQuickAdd();
      } else {
        toast.error(
          response.status === 401
            ? 'Vui lòng đăng nhập để thêm vào giỏ hàng'
            : result.error?.message || 'Không thể thêm vào giỏ hàng. Vui lòng thử lại!'
        );
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi kết nối đến cơ sở dữ liệu giỏ hàng');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#164F8D]">Tất cả sản phẩm</h1>
          <p className="text-gray-500 text-sm mt-1">Khám phá bộ sưu tập thời trang unisex mới nhất tại BlueWear</p>
          {collectionFilter ? <p className="text-xs text-[#17579B] mt-2">Đang lọc theo bộ sưu tập: {collectionFilter}</p> : null}
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
              <option key={option.value} value={option.value}>{option.label}</option>
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
                aria-label="Tìm kiếm sản phẩm"
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
              aria-label="Giá tối thiểu"
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
              aria-label="Giá tối đa"
              value={maxPriceInput}
              onChange={(event) => {
                setMaxPriceInput(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Giá tối đa"
              className="w-32 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#17579B]"
            />
          </div>

          <label className="sr-only" htmlFor="mobile-category-filter">Danh mục sản phẩm</label>
          <select
            id="mobile-category-filter"
            value={selectedCategorySlug}
            onChange={(event) => {
              setSelectedCategorySlug(event.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#17579B] lg:hidden"
          >
            {sidebarItems.map((item) => (
              <option key={item.key} value={item.key}>{item.label}</option>
            ))}
          </select>
        </div>

        {hasActiveFilters ? (
          <div className="flex justify-end">
            <button type="button" onClick={resetFilters} className="text-sm font-medium text-[#17579B] hover:text-[#0e3b6d]">
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
                    selectedCategorySlug === item.key ? 'bg-[#17579B] text-white font-medium' : 'text-gray-600 hover:bg-gray-200'
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
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700" role="alert">
              <p className="font-semibold">Không thể tải danh sách sản phẩm</p>
              <p className="mt-1">{errorMessage}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setReloadToken((token) => token + 1)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#17579B] px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
                >
                  <RefreshCw size={14} /> Thử lại
                </button>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                  >
                    Xóa bộ lọc
                  </button>
                ) : null}
              </div>
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
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-12 text-center text-gray-600">
              <p className="font-medium">Không có sản phẩm phù hợp.</p>
              <p className="mt-1 text-sm text-gray-500">Hãy thử thay đổi từ khóa hoặc bộ lọc.</p>
              {hasActiveFilters ? (
                <button type="button" onClick={resetFilters} className="mt-4 rounded-lg bg-[#17579B] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                  Xóa bộ lọc
                </button>
              ) : null}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {products.map((product) => {
                  const image = product.images[0];
                  const displayPrice = product.salePrice ?? product.price;

                  return (
                    <div key={product.id} className="group relative flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-md transition-shadow">
                      <Link href={`/products/${product.slug}`} className="relative bg-gray-100 aspect-[3/4] overflow-hidden block">
                        <Image
                          src={image?.url ?? '/images/t_shirt_1.png'}
                          alt={image?.altText ?? product.name}
                          fill
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          unoptimized
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>

                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        aria-label="Thêm vào yêu thích"
                        className="absolute top-3 right-3 p-1.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:text-red-500 z-10"
                      >
                        <Heart size={18} />
                      </button>

                      <span className="absolute top-3 left-3 bg-white/90 text-xs px-2 py-1 rounded text-gray-700 font-medium z-10">
                        {product.category.name}
                      </span>

                      <div className="p-4 flex flex-col flex-grow">
                        <Link href={`/products/${product.slug}`} className="block mb-2 flex-grow">
                          <h3 className="text-sm text-gray-700 line-clamp-1 group-hover:text-[#164F8D] transition-colors font-medium">
                            {product.name}
                          </h3>
                        </Link>

                        <div className="flex items-center gap-2 mb-4">
                          <p className="font-semibold text-[#164F8D]">{formatPrice(displayPrice)}</p>
                          {product.salePrice !== null ? (
                            <p className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</p>
                          ) : null}
                        </div>

                        {/* NÚT THÊM NHANH MỞ MODAL CHỌN PHÂN LOẠI TỪ DATABASE */}
                        <button
                          type="button"
                          disabled={isFetchingDetail}
                          onClick={(e) => handleOpenQuickAdd(product, e)}
                          className="w-full bg-[#164F8D] hover:bg-[#123d6d] text-white text-sm font-medium py-2.5 px-4 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isFetchingDetail ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
                          <span>Thêm vào giỏ</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* PAGINATION UI */}
              {totalPages > 1 && (
                <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Phân trang sản phẩm">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    aria-label="Trang trước"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
                  >
                    Trang trước
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, index) => index + 1)
                      .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                      .map((pageNum, index, pages) => (
                        <Fragment key={pageNum}>
                          {index > 0 && pages[index - 1] !== pageNum - 1 ? <span className="px-1 text-gray-400">…</span> : null}
                          <button
                            type="button"
                            onClick={() => setCurrentPage(pageNum)}
                            aria-current={currentPage === pageNum ? 'page' : undefined}
                            aria-label={`Trang ${pageNum}`}
                            className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === pageNum ? 'bg-[#164F8D] text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        </Fragment>
                      ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    aria-label="Trang sau"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
                  >
                    Trang sau
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>

      {/* MODAL POPUP QUICK ADD (TRUY VẤN MÀU, SIZE, SỐ LƯỢNG TỪ DATABASE) */}
      {activeProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div role="dialog" aria-modal="true" aria-labelledby="quick-add-title" className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90dvh] overflow-y-auto relative animate-in fade-in zoom-in duration-200">
            <button
              type="button"
              onClick={handleCloseQuickAdd}
              aria-label="Đóng chọn nhanh sản phẩm"
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full bg-gray-100 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6 border-b pb-4">
                <Image
                  src={activeProduct.images[0]?.url || '/images/t_shirt_1.png'}
                  alt={activeProduct.name}
                  width={64}
                  height={80}
                  unoptimized
                  className="w-16 h-20 object-cover rounded-lg bg-gray-100"
                />
                <div>
                  <h3 id="quick-add-title" className="font-bold text-gray-800 text-base line-clamp-1">{activeProduct.name}</h3>
                  <p className="text-[#164F8D] font-bold text-lg mt-1">
                    {formatPrice(activeProduct.salePrice ?? activeProduct.price)}
                  </p>
                </div>
              </div>

              {/* Chọn Màu sắc */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Màu sắc:</p>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((v) => {
                    const isSelected = selectedColorId === v.color.id;
                    return (
                      <button
                        key={v.color.id}
                        type="button"
                        onClick={() => {
                          setSelectedColorId(v.color.id);
                          setQuantity(1);
                          const firstAvailableSize = activeProduct.variants?.find(
                            (item) => item.color.id === v.color.id && item.stockQuantity > 0
                          ) || activeProduct.variants?.find((item) => item.color.id === v.color.id);
                          if (firstAvailableSize) setSelectedSizeId(firstAvailableSize.size.id);
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all cursor-pointer ${
                          isSelected ? 'border-[#164F8D] bg-blue-50 text-[#164F8D] font-medium' : 'border-gray-200 text-gray-700'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: v.color.hexCode }} />
                        {v.color.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chọn Kích thước (Size) */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Kích thước:</p>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((v) => {
                    const isSelected = selectedSizeId === v.size.id;
                    const available = isSizeAvailable(v.size.id);
                    return (
                      <button
                        key={v.size.id}
                        type="button"
                        disabled={!available}
                        onClick={() => {
                          setSelectedSizeId(v.size.id);
                          setQuantity(1);
                        }}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                          isSelected ? 'border-[#164F8D] bg-[#164F8D] text-white' : 'border-gray-200 text-gray-700'
                        } ${!available ? 'opacity-40 line-through cursor-not-allowed bg-gray-50' : ''}`}
                      >
                        {v.size.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Số lượng */}
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Số lượng:</p>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 text-sm font-semibold text-gray-800">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(selectedVariant?.stockQuantity ?? 1, q + 1))}
                    disabled={quantity >= (selectedVariant?.stockQuantity ?? 1)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Tồn kho */}
              <div className="mb-6 text-xs text-gray-500">
                {selectedVariant ? (
                  <span className={selectedVariant.stockQuantity > 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                    {selectedVariant.stockQuantity > 0 ? `✓ Còn lại ${selectedVariant.stockQuantity} sản phẩm trong kho` : '✕ Hết hàng'}
                  </span>
                ) : (
                  <span>Vui lòng chọn phân loại</span>
                )}
              </div>

              <button
                type="button"
                disabled={!selectedVariant || selectedVariant.stockQuantity < 1 || isAdding}
                onClick={handleConfirmAddToCart}
                className="w-full bg-[#164F8D] hover:bg-[#123d6d] text-white py-3 rounded-xl font-semibold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ShoppingCart size={18} />
                <span>{isAdding ? 'Đang thêm...' : 'Xác nhận thêm vào giỏ hàng'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
