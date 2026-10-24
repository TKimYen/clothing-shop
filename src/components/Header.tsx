// src/components/Header.tsx
'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, ShoppingCart, X } from 'lucide-react';
import { FormEvent, useState, useEffect } from 'react';
import AuthButtons from "../components/AuthButtons";

type HeaderCollection = {
    id: string;
    name: string;
    slug: string;
};

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const [searchKeyword, setSearchKeyword] = useState('');
    const [cartCount, setCartCount] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [collections, setCollections] = useState<HeaderCollection[]>([]);

    // Lấy số lượng sản phẩm trong giỏ hàng từ API để hiển thị huy hiệu động
    useEffect(() => {
        async function fetchCartCount() {
            try {
                const res = await fetch('/api/cart', { cache: 'no-store' });
                const result = await res.json();
                if (result.success && Array.isArray(result.data)) {
                    // Badge hiển thị số sản phẩm/biến thể khác nhau, không phải tổng số lượng.
                    setCartCount(result.data.length);
                }
            } catch (error) {
                console.error("Không thể tải số lượng giỏ hàng:", error);
            }
        }

        fetchCartCount();

        const handleCartUpdated = () => {
            void fetchCartCount();
        };

        window.addEventListener('cart-updated', handleCartUpdated);

        return () => {
            window.removeEventListener('cart-updated', handleCartUpdated);
        };
    }, [pathname]); // Cập nhật lại mỗi khi đổi trang

    useEffect(() => {
        let isActive = true;

        fetch('/api/collections', { cache: 'no-store' })
            .then(async (response) => {
                const result = await response.json() as {
                    success: boolean;
                    data?: HeaderCollection[];
                };
                if (!response.ok || !result.success) {
                    throw new Error('Không thể tải danh sách bộ sưu tập');
                }
                if (isActive) setCollections(result.data ?? []);
            })
            .catch((error: unknown) => {
                console.error('Không thể tải menu bộ sưu tập:', error);
            });

        return () => {
            isActive = false;
        };
    }, []);

    useEffect(() => {
        if (!isMobileMenuOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsMobileMenuOpen(false);
        };
        document.addEventListener('keydown', onKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

    const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const keyword = searchKeyword.trim();

        if (keyword) {
            router.push(`/products?search=${encodeURIComponent(keyword)}`);
        } else {
            router.push('/products');
        }
        
        setSearchKeyword('');
    };

    const isProductsPage = pathname === '/products';

    return (
        <header className="w-full">
            <div className="bg-[#17579B] text-white text-xs py-2">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    <p>Miễn phí vận chuyển cho đơn hàng từ 600.000đ</p>
                    <div className="hidden md:flex gap-4 items-center">
                        <span>Giảm 10% cho khách hàng mới</span>
                        <AuthButtons />
                    </div>
                </div>
            </div>

            <div className="border-b bg-white sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
                    <Link href="/" className="text-3xl font-bold text-[#164F8D] shrink-0">
                        BlueWear
                    </Link>

                    <nav className="hidden lg:flex gap-6 font-medium text-gray-600">
                        <Link
                            href="/"
                            className={`pb-1 transition-colors ${pathname === '/'
                                ? 'text-[#164F8D] font-semibold border-b-2 border-[#164F8D]'
                                : 'hover:text-[#164F8D]'
                                }`}
                        >
                            Trang chủ
                        </Link>

                        <Link
                            href="/products"
                            className={`pb-1 transition-colors ${isProductsPage
                                ? 'text-[#164F8D] font-semibold border-b-2 border-[#164F8D]'
                                : 'hover:text-[#164F8D]'
                                }`}
                        >
                            Sản phẩm
                        </Link>

                        <div className="group relative">
                            <Link
                            href="/collections"
                            className={`inline-block pb-1 transition-colors ${pathname.startsWith('/collections')
                                ? 'text-[#164F8D] font-semibold border-b-2 border-[#164F8D]'
                                : 'hover:text-[#164F8D]'
                                }`}
                            >
                                Bộ sưu tập
                            </Link>
                            {collections.length > 0 ? (
                                <div className="invisible absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 translate-y-2 rounded-xl border border-gray-100 bg-white p-2 opacity-0 shadow-xl transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                                    {collections.map((collection) => (
                                        <Link
                                            key={collection.id}
                                            href={`/collections/${collection.slug}`}
                                            className="block rounded-lg px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-black"
                                        >
                                            {collection.name}
                                        </Link>
                                    ))}
                                </div>
                            ) : null}
                        </div>

                        <Link
                            href="/about"
                            className={`pb-1 transition-colors ${pathname === '/about'
                                ? 'text-[#164F8D] font-semibold border-b-2 border-[#164F8D]'
                                : 'hover:text-[#164F8D]'
                                }`}
                        >
                            Giới thiệu
                        </Link>

                        <Link
                            href="/contact"
                            className="hover:text-[#164F8D]"
                        >
                            Liên hệ
                        </Link>
                    </nav>

                    <div className="flex items-center gap-4 ml-auto">
                        {!isProductsPage && (
                            <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
                                <input
                                    type="text"
                                    value={searchKeyword}
                                    onChange={(event) => setSearchKeyword(event.target.value)}
                                    placeholder="Tìm kiếm sản phẩm..."
                                    aria-label="Tìm kiếm sản phẩm"
                                    className="w-64 bg-white text-gray-700 placeholder:text-gray-400 border border-[#17579B] rounded-full px-4 py-2 pr-10 text-sm shadow-sm outline-none focus:border-[#164F8D] focus:ring-2 focus:ring-[#dbeafe]"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#17579B] cursor-pointer"
                                    aria-label="Tìm kiếm"
                                >
                                    <Search size={18} />
                                </button>
                            </form>
                        )}

                        <Link href="/cart" className="p-2 hover:bg-gray-100 rounded-full relative shrink-0">
                            <ShoppingCart size={24} className="text-[#164F8D]" />
                            {/* Chỉ hiển thị số lượng đỏ khi giỏ hàng có sản phẩm (> 0) */}
                            {cartCount > 0 && (
                                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                        <button
                            type="button"
                            aria-label={isMobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
                            aria-expanded={isMobileMenuOpen}
                            onClick={() => setIsMobileMenuOpen((open) => !open)}
                            className="grid size-10 place-items-center rounded-full text-[#164F8D] hover:bg-gray-100 lg:hidden"
                        >
                            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
                {isMobileMenuOpen && (
                    <div className="border-t border-gray-100 bg-white px-4 py-4 shadow-lg lg:hidden">
                        <form onSubmit={handleSearchSubmit} className="relative mb-4">
                            <input
                                type="text"
                                value={searchKeyword}
                                onChange={(event) => setSearchKeyword(event.target.value)}
                                placeholder="Tìm kiếm sản phẩm..."
                                aria-label="Tìm kiếm sản phẩm"
                                className="w-full rounded-full border border-[#17579B] bg-white px-4 py-2 pr-10 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#dbeafe]"
                            />
                            <button type="submit" aria-label="Tìm kiếm" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                                <Search size={18} />
                            </button>
                        </form>
                        <nav aria-label="Điều hướng mobile" className="grid gap-1 text-sm font-medium text-gray-700">
                            {[
                                ['/', 'Trang chủ'],
                                ['/products', 'Sản phẩm'],
                                ['/collections', 'Bộ sưu tập'],
                                ['/about', 'Giới thiệu'],
                                ['/contact', 'Liên hệ'],
                            ].map(([href, label]) => (
                                <Link key={href} href={href} onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg px-3 py-3 hover:bg-gray-50">
                                    {label}
                                </Link>
                            ))}
                            {collections.length > 0 ? (
                                <div className="ml-3 grid gap-1 border-l border-gray-200 pl-3">
                                    {collections.map((collection) => (
                                        <Link
                                            key={collection.id}
                                            href={`/collections/${collection.slug}`}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="rounded-lg px-3 py-2 text-sm font-normal text-gray-500 hover:bg-gray-50 hover:text-black"
                                        >
                                            {collection.name}
                                        </Link>
                                    ))}
                                </div>
                            ) : null}
                        </nav>
                        <div className="mt-3 border-t border-gray-100 pt-3 text-sm text-gray-700">
                            <AuthButtons />
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
