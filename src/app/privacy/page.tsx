// src/app/privacy/page.tsx
export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-[#164F8D] mb-3">Chính sách bảo mật</h1>
        <p className="text-gray-600 text-sm">
          Cam kết bảo mật thông tin cá nhân và quyền riêng tư của khách hàng tại BlueWear.
        </p>
      </div>

      <div className="space-y-8 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">1. Thu thập thông tin cá nhân</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Chúng tôi thu thập các thông tin cần thiết từ quý khách bao gồm: họ tên, số điện thoại, email và địa chỉ giao hàng khi quý khách đăng ký tài khoản hoặc tiến hành đặt mua sản phẩm trên website.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">2. Mục đích sử dụng thông tin</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Thông tin cá nhân của quý khách sẽ được sử dụng độc quyền cho các mục đích:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
            <li>Xử lý đơn hàng và giao sản phẩm đến tay khách hàng nhanh chóng.</li>
            <li>Hỗ trợ chăm sóc khách hàng, giải đáp thắc mắc và xử lý đổi trả.</li>
            <li>Gửi thông báo về trạng thái đơn hàng hoặc các chương trình ưu đãi mới (nếu khách hàng đồng ý).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">3. Cam kết bảo mật</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            BlueWear cam kết tuyệt đối không mua bán, chia sẻ hay trao đổi thông tin cá nhân của khách hàng cho bất kỳ bên thứ ba nào khác ngoài các đối tác vận chuyển phục vụ trực tiếp cho việc giao đơn hàng.
          </p>
        </section>
      </div>
    </div>
  );
}