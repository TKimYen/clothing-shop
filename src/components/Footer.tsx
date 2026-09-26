// src/components/Footer.tsx
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
                    <div className="flex gap-4">
                        <FaFacebook size={20} className="text-gray-300 hover:text-white cursor-pointer" />
                        <FaInstagram size={20} className="text-gray-300 hover:text-white cursor-pointer" />
                        <FaLinkedin size={20} className="text-gray-300 hover:text-white cursor-pointer" />
                        <FaTwitter size={20} className="text-gray-300 hover:text-white cursor-pointer" />
                    </div>
                </div>

                {/* Links 1 */}
                <div>
                    <h4 className="font-semibold mb-4 text-lg">Hỗ trợ khách hàng</h4>
                    <ul className="space-y-2 text-sm text-gray-300">
                        <li><Link href="#" className="hover:text-white">Trung tâm trợ giúp</Link></li>
                        <li><Link href="#" className="hover:text-white">Chính sách đổi trả</Link></li>
                        <li><Link href="#" className="hover:text-white">Chính sách vận chuyển</Link></li>
                        <li><Link href="#" className="hover:text-white">Câu hỏi thường gặp</Link></li>
                    </ul>
                </div>

                {/* Links 2 */}
                <div>
                    <h4 className="font-semibold mb-4 text-lg">Về chúng tôi</h4>
                    <ul className="space-y-2 text-sm text-gray-300">
                        <li><Link href="#" className="hover:text-white">Giới thiệu</Link></li>
                        <li><Link href="#" className="hover:text-white">Tuyển dụng</Link></li>
                        <li><Link href="#" className="hover:text-white">Liên hệ</Link></li>
                    </ul>
                </div>

                {/* Newsletter & Payment Methods */}
                <div>
                    <h4 className="font-semibold mb-4 text-lg">Đăng ký nhận tin</h4>
                    <p className="text-sm text-gray-300 mb-4">Nhận thông tin khuyến mãi và sản phẩm mới nhất</p>
                    <div className="flex mb-6">
                        <input
                            type="email"
                            placeholder="Nhập email của bạn"
                            className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-l-md w-full focus:outline-none focus:border-white text-sm"
                        />
                        <button className="bg-white text-[#17579B] px-4 py-2 rounded-r-md font-medium hover:bg-gray-100">
                            →
                        </button>
                    </div>

                    {/* Phần thêm ảnh thanh toán (payment.png) */}
                    <div>
                        <p className="text-xs text-gray-300 mb-2">Phương thức thanh toán</p>
                        <div className="relative w-48 h-8">
                            <Image
                                src="/images/payment.png"
                                alt="Payment Methods"
                                fill
                                className="object-contain object-left"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400">
                <p>© 2024 BlueWear. All rights reserved.</p>
                <div className="flex gap-4 mt-4 md:mt-0">
                    <Link href="#" className="hover:text-white">Điều khoản sử dụng</Link>
                    <Link href="#" className="hover:text-white">Chính sách bảo mật</Link>
                </div>
            </div>
        </footer>
    );
}