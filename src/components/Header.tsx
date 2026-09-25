// src/components/Header.tsx
'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ShoppingCart, User, Bell } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const [searchKeyword, setSearchKeyword] = useState('');

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        if (pathname === '/products') {
            const params = new URLSearchParams(window.location.search);
            const keyword = params.get('search') ?? params.get('q') ?? '';
            setSearchKeyword(keyword);
            return;
        }

        setSearchKeyword('');
    }, [pathname]);

    const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const keyword = searchKeyword.trim();
        const params = new URLSearchParams();

        if (keyword) {
            params.set('search', keyword);
        }

        const targetUrl = params.size > 0 ? `/products?${params.toString()}` : '/products';
        router.push(targetUrl);
    };

    return (
        <header className="w-full">
            <div className="bg-[#17579B] text-white text-xs py-2">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    <p>Miễn phí vận chuyển cho đơn hàng từ 600.000đ</p>
                    <div className="hidden md:flex gap-4 items-center">
                        <span>Giảm 10% cho khách hàng mới</span>
                        <Link href="#" className="font-bold text-sm hover:underline">Đăng nhập / Đăng ký</Link>
                    </div>
                    <div className="flex items-center gap-2 md:hidden">
                        <Bell size={16} />
                        <User size={16} />
                        <span>HPNgocTuong</span>
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
                            className={`pb-1 transition-colors ${pathname === '/products'
                                ? 'text-[#164F8D] font-semibold border-b-2 border-[#164F8D]'
                                : 'hover:text-[#164F8D]'
                                }`}
                        >
                            Sản phẩm
                        </Link>

                        <Link
                            href="/collections"
                            className={`pb-1 transition-colors ${pathname === '/collections'
                                ? 'text-[#164F8D] font-semibold border-b-2 border-[#164F8D]'
                                : 'hover:text-[#164F8D]'
                                }`}
                        >
                            Bộ sưu tập
                        </Link>

                        <Link
                            href="/about"
                            className={`pb-1 transition-colors ${pathname === '/about'
                                ? 'text-[#164F8D] font-semibold border-b-2 border-[#164F8D]'
                                : 'hover:text-[#164F8D]'
                                }`}
                        >
                            Giới thiệu
                        </Link>

                        <Link href="#" className="hover:text-[#164F8D]">Liên hệ</Link>
                    </nav>

                    <div className="flex items-center gap-4 ml-auto">
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
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#17579B]"
                                aria-label="Tìm kiếm"
                            >
                                <Search size={18} />
                            </button>
                        </form>

                        <Link href="/cart" className="p-2 hover:bg-gray-100 rounded-full relative shrink-0">
                            <ShoppingCart size={24} className="text-[#164F8D]" />
                            <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                                2
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}
