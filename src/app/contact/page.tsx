// src/app/contact/page.tsx
'use client';

import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useState, FormEvent } from 'react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="text-center max-w-xl mx-auto mb-12">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#17579B] bg-blue-50 px-3 py-1 rounded-full">
          Hỗ trợ khách hàng
        </span>
        <h1 className="text-3xl md:text-4xl font-bold text-[#164F8D] mt-3 mb-2">
          Liên hệ với BlueWear
        </h1>
        <p className="text-gray-600 text-sm">
          Bạn có thắc mắc về đơn hàng hay cần tư vấn sản phẩm? Hãy gửi tin nhắn cho chúng tôi nhé!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Thông tin liên hệ bên trái */}
        <div className="bg-[#164F8D] text-white p-8 rounded-2xl shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-4">Thông tin cửa hàng</h2>
            <p className="text-blue-100 text-sm mb-6 leading-relaxed">
              Luôn sẵn sàng lắng nghe và giải đáp mọi thắc mắc của bạn từ 8:00 đến 22:00 hằng ngày.
            </p>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin size={20} className="shrink-0 mt-0.5 text-blue-200" />
                <span>273 An Dương Vương, Phường 3, Quận 5, TP. Hồ Chí Minh</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={20} className="shrink-0 text-blue-200" />
                <span>0909 123 456</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={20} className="shrink-0 text-blue-200" />
                <span>support@bluewear.vn</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-blue-400/30 text-xs text-blue-200">
            © 2026 BlueWear Store. All rights reserved.
          </div>
        </div>

        {/* Form gửi tin nhắn bên phải */}
        <div className="lg:col-span-2 bg-gray-50 p-8 rounded-2xl border border-gray-100 shadow-sm">
          {submitted ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">✓</div>
              <h3 className="text-xl font-bold text-gray-800">Cảm ơn bạn đã liên hệ!</h3>
              <p className="text-gray-600 text-sm">Thông tin của bạn đã được gửi thành công. BlueWear sẽ phản hồi lại trong thời gian sớm nhất.</p>
              <button 
                onClick={() => setSubmitted(false)}
                className="mt-4 px-6 py-2.5 bg-[#17579B] text-white rounded-xl text-sm font-medium hover:opacity-90"
              >
                Gửi tin nhắn mới
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Gửi lời nhắn cho chúng tôi</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Họ và tên của bạn</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Nguyễn Văn A" 
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#17579B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Số điện thoại</label>
                  <input 
                    required
                    type="tel" 
                    placeholder="0901234567" 
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#17579B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Địa chỉ Email</label>
                <input 
                  required
                  type="email" 
                  placeholder="example@email.com" 
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#17579B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nội dung cần hỗ trợ</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Nhập nội dung tin nhắn..." 
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#17579B] resize-none"
                ></textarea>
              </div>

              <button 
                type="submit"
                className="w-full bg-[#164F8D] hover:bg-[#123d6d] text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-md text-sm"
              >
                <Send size={16} />
                <span>Gửi thông tin liên hệ</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}