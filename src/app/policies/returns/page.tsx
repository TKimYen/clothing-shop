// src/app/policies/returns/page.tsx
export const dynamic = "force-dynamic";

export default function ReturnsPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-[#164F8D] mb-3">Chính sách đổi trả</h1>
        <p className="text-gray-600 text-sm">
          Cam kết quyền lợi cho khách hàng khi mua sắm thời trang tại BlueWear.
        </p>
      </div>

      <div className="space-y-8 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">1. Điều kiện đổi trả sản phẩm</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            BlueWear hỗ trợ đổi trả trong vòng 7 NGÀY kể từ ngày khách hàng nhận được sản phẩm (tính theo dấu vận chuyển của đơn vị giao hàng), với điều kiện:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
            <li>Sản phẩm còn nguyên tem, mác, nhãn giá và chưa qua giặt ủi hay sử dụng.</li>
            <li>Sản phẩm không bị dơ bẩn, trầy xước hoặc có mùi lạ (nước hoa, cơ thể,...).</li>
            <li>Có lỗi phát sinh từ nhà sản xuất (lỗi vải, rách, bung chỉ,...) hoặc giao nhầm size, nhầm màu.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">2. Các trường hợp không hỗ trợ đổi trả</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
            <li>Yêu cầu đổi trả quá thời hạn 7 NGÀY quy định.</li>
            <li>Sản phẩm đã qua sử dụng, đã giặt tẩy hoặc bị hư hỏng do lỗi chủ quan của khách hàng.</li>
            <li>Sản phẩm mua trong các chương trình khuyến mại lớn / flash sale (trừ trường hợp có quy định riêng).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">3. Quy trình thực hiện đổi trả</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Bước 1: Quý khách liên hệ qua trang LIÊN HỆ hoặc nhắn tin trực tiếp cho Facebook/Instagram/X của BlueWear kèm theo hình ảnh, video khi unbox sản phẩm và lý do đổi trả.<br />
            Bước 2: Sau khi nhân viên xác nhận đủ điều kiện, quý khách gửi sản phẩm về kho của BlueWear.<br />
            Bước 3: Chúng tôi tiến hành kiểm tra và gửi lại sản phẩm thay thế (hoặc hoàn tiền) trong vòng 3-5 ngày làm việc.
          </p>
        </section>
      </div>
    </div>
  );
}