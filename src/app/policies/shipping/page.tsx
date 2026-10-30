// src/app/policies/shipping/page.tsx
export const dynamic = "force-dynamic";

export default function ShippingPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-[#164F8D] mb-3">Chính sách vận chuyển</h1>
        <p className="text-gray-600 text-sm">
          Thông tin chi tiết về thời gian và cước phí giao nhận đơn hàng tại BlueWear.
        </p>
      </div>

      <div className="space-y-8 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">1. Phạm vi giao hàng</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            BlueWear thực hiện giao hàng trên toàn quốc thông qua các đơn vị vận chuyển (Giao Hàng Nhanh, Viettel Post, J&T Express,...).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">2. Thời gian giao hàng</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
            <li><strong>Khu vực TP.HCM & Hà Nội:</strong> Từ 1 - 3 ngày làm việc.</li>
            <li><strong>Các khu vực tỉnh thành khác:</strong> Từ 3 - 5 ngày làm việc.</li>
            <li>Thời gian trên không tính Chủ nhật và các ngày Lễ, Tết. Thời gian giao hàng thực tế có thể thay đổi tùy thuộc vào điều kiện thời tiết hoặc địa chỉ vùng sâu vùng xa.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">3. Biểu phí vận chuyển</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
            <li>Phí vận chuyển tiêu chuẩn dao động từ 15.000đ - 40.000đ tùy theo khu vực nhận hàng.</li>
            <li>Miễn phí vận chuyển toàn quốc cho tất cả các đơn hàng có giá trị từ 600.000đ trở lên.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">4. Kiểm tra hàng hóa khi nhận</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Quý khách hàng được quyền kiểm tra gói hàng (đồng kiểm) trước khi thanh toán cho nhân viên giao hàng. Nếu phát hiện bưu phẩm rách vỡ hoặc sai lệch thông tin, vui lòng từ chối nhận hàng và liên hệ ngay với chúng tôi để được hỗ trợ kịp thời.
          </p>
        </section>
      </div>
    </div>
  );
}