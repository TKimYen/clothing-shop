// src/components/Footer.tsx
'use client';

import Link from "next/link";
import Image from "next/image";
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from 'react-icons/fa';

export default function Footer() {
    return (
        <footer className="bg-[#17579B] text-white pt-16 pb-8 mt-12">
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                {/* Brand */}
                <div>
                    <h3 className="text-2xl font-bold mb-4">BlueWear</h3>
                    <p className="text-gray-300 text-sm mb-6">
                        Thời trang unisex dành cho mọi người. Chất lượng tạo nên phong cách.
                    </p>
                    <div className="flex gap-4" aria-label="Mạng xã hội">
                        <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook"><FaFacebook size={20} className="text-gray-300 hover:text-white" /></a>
                        <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><FaInstagram size={20} className="text-gray-300 hover:text-white" /></a>
                        <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn"><FaLinkedin size={20} className="text-gray-300 hover:text-white" /></a>
                        <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter"><FaTwitter size={20} className="text-gray-300 hover:text-white" /></a>
                    </div>
                </div>

                {/* Links 1: Hỗ trợ khách hàng */}
                <div>
                    <h4 className="font-semibold mb-4 text-lg">Hỗ trợ khách hàng</h4>
                    <ul className="space-y-2 text-sm text-gray-300">
                        <li><Link href="/help" className="hover:text-white">Trung tâm trợ giúp</Link></li>
                        <li><Link href="/policies/returns" className="hover:text-white">Chính sách đổi trả</Link></li>
                        <li><Link href="/policies/shipping" className="hover:text-white">Chính sách vận chuyển</Link></li>
                        <li><Link href="/faq" className="hover:text-white">Câu hỏi thường gặp</Link></li>
                    </ul>
                </div>

                {/* Links 2: Về chúng tôi */}
                <div>
                    <h4 className="font-semibold mb-4 text-lg">Về chúng tôi</h4>
                    <ul className="space-y-2 text-sm text-gray-300">
                        <li><Link href="/about" className="hover:text-white">Giới thiệu</Link></li>
                        <li><Link href="/careers" className="hover:text-white">Tuyển dụng</Link></li>
                        <li><Link href="/contact" className="hover:text-white">Liên hệ</Link></li>
                    </ul>
                </div>

                {/* Newsletter & Payment Methods */}
                <div>
                    <h4 className="font-semibold mb-4 text-lg">Phương thức thanh toán</h4>
                    <div>
                        <div className="relative w-48 h-8">
                            <Image
                                src="/images/payment.png"
                                alt="Payment Methods"
                                fill
                                sizes="100vw"
                                className="object-contain object-left"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400">
                <p>© {new Date().getFullYear()} BlueWear. All rights reserved.</p>
                <div className="flex gap-4 mt-4 md:mt-0">
                    <Link href="/terms" className="hover:text-white">Điều khoản sử dụng</Link>
                    <Link href="/privacy" className="hover:text-white">Chính sách bảo mật</Link>
                </div>
            </div>
        </footer>
    );
}