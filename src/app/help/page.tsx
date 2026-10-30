// src/app/help/page.tsx
export const dynamic = "force-dynamic";

export default function HelpCenterPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-[#164F8D] mb-3">Trung tâm trợ giúp</h1>
        <p className="text-gray-600 text-sm">
          Chúng tôi luôn sẵn sàng hỗ trợ bạn giải đáp mọi thắc mắc trong quá trình mua sắm tại BlueWear.
        </p>
      </div>

      <div className="space-y-8 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">1. Hướng dẫn đặt hàng trực tuyến</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Việc mua sắm tại BlueWear cực kỳ đơn giản và nhanh chóng:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
            <li>Tìm kiếm sản phẩm yêu thích thông qua thanh tìm kiếm hoặc các danh mục thời trang.</li>
            <li>Chọn phân loại sản phẩm (Màu sắc, Kích cỡ) và số lượng mong muốn, sau đó bấm <strong>Thêm vào giỏ hàng</strong> hoặc <strong>Mua ngay</strong>.</li>
            <li>Kiểm tra lại giỏ hàng, điền đầy đủ thông tin giao hàng và lựa chọn phương thức thanh toán phù hợp để hoàn tất đơn hàng.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">2. Phương thức thanh toán</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            BlueWear hỗ trợ các hình thức thanh toán an toàn và tiện lợi bao gồm: thanh toán khi nhận hàng (COD), thanh toán trực tuyến qua cổng thanh toán bảo mật (PayPal, thẻ tín dụng Visa/MasterCard).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">3. Kênh hỗ trợ trực tiếp</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Nếu bạn gặp bất kỳ khó khăn nào trong quá trình đặt hàng hoặc cần tư vấn thêm, hãy liên hệ ngay với chúng tôi qua trang <strong>Liên hệ</strong> hoặc nhắn tin trực tiếp qua các kênh mạng xã hội chính thức của BlueWear ở cuối trang. Đội ngũ chăm sóc khách hàng sẽ phản hồi trong thời gian sớm nhất!
          </p>
        </section>
      </div>
    </div>
  );
}