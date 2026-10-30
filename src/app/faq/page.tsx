// src/app/faq/page.tsx
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";

export const dynamic = "force-dynamic";

export default function FAQPage() {
  const faqs = [
    {
      question: "Làm thế nào để tôi chọn đúng kích cỡ (size) quần áo?",
      answer: "Mỗi sản phẩm trên BlueWear đều đính kèm bảng quy đổi kích thước chi tiết (Size Chart), tuy nhiên bảng Size Chart chỉ mang tính chất tham khảo và có thể lệch vài cm so với sản phẩm. Bạn có thể nhắn tin trực tiếp cho chúng tôi để được tư vấn chính xác nhất",
    },
    {
      question: "Tôi có được kiểm tra hàng trước khi thanh toán không?",
      answer: "Dạ có. Tất cả các đơn hàng giao bởi BlueWear đều cho phép quý khách hàng đồng kiểm trước khi nhận hàng và thanh toán cho shipper.",
    },
    {
      question: "Chính sách đổi trả sản phẩm diễn ra như thế nào?",
      answer: "BlueWear chỉ hỗ trợ đổi trả trong vòng 7 ngày kể từ khi nhận hàng đối với các sản phẩm còn nguyên tem mác, chưa qua sử dụng và có lỗi từ nhà sản xuất hoặc nhầm lẫn về size/màu sắc, không hỗ trợ đổi trả cho các nguyên nhân chủ quan.",
    },
    {
      question: "Làm sao để theo dõi trạng thái đơn hàng của tôi?",
      answer: "Sau khi đặt hàng thành công, bạn sẽ được chuyển sang trong theo dõi đơn hàng. Bạn cũng có thể tra cứu trực tiếp trạng thái đơn hàng trong trang Tài khoản cá nhân mục Đơn hàng.",
    },
    {
      question: "BlueWear có hỗ trợ phí vận chuyển không?",
      answer: "Chúng tôi áp dụng chương trình miễn phí vận chuyển toàn quốc cho các đơn hàng có giá trị từ 600.000đ trở lên.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">

      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#164F8D] mb-3">Câu hỏi thường gặp (FAQ)</h1>
          <p className="text-gray-600 text-sm">
            Tổng hợp các thắc mắc phổ biến của khách hàng khi mua sắm tại thời trang unisex BlueWear.
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {faq.question}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </main>

    </div>
  );
}