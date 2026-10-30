// src/app/terms/page.tsx
export const dynamic = "force-dynamic";

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-[#164F8D] mb-3">Điều khoản sử dụng</h1>
        <p className="text-gray-600 text-sm">
          Các quy định, điều kiện pháp lý khi quý khách truy cập và sử dụng dịch vụ tại website BlueWear.
        </p>
      </div>

      <div className="space-y-8 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-gray-700 text-sm leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">1. Chấp nhận các điều khoản</h2>
          <p>
            Khi truy cập, sử dụng website thương mại điện tử <strong>BlueWear</strong> hoặc thực hiện việc mua sắm các sản phẩm thời trang unisex trực tuyến, quý khách đồng ý tuân thủ và chịu ràng buộc bởi các điều khoản sử dụng được quy định dưới đây. Nếu quý khách không đồng ý với bất kỳ điều khoản nào, vui lòng ngưng sử dụng trang web.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">2. Đăng ký tài khoản và bảo mật</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Quý khách có thể đăng ký tài khoản thành viên để tích lũy ưu đãi và quản lý đơn hàng dễ dàng hơn.</li>
            <li>Khi đăng ký tài khoản, quý khách có trách nhiệm cung cấp thông tin chính xác, đầy đủ và tự bảo mật thông tin tài khoản, mật khẩu của mình.</li>
            <li>BlueWear có quyền khóa hoặc từ chối cung cấp dịch vụ nếu phát hiện tài khoản có dấu hiệu gian lận, mạo danh, vi phạm bảo mật hệ thống hoặc vi phạm pháp luật.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">3. Quy định về sản phẩm và giá cả</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Các sản phẩm thời trang (áo thun, quần jean, áo khoác,...) được trưng bày trên website đều có mô tả chi tiết về kiểu dáng, chất liệu và bảng hướng dẫn kích thước (Size Chart).</li>
            <li>Giá bán sản phẩm được niêm yết bằng Việt Nam Đồng (VNĐ) và đã bao gồm thuế giá trị gia tăng (VAT) theo quy định hiện hành. Phí vận chuyển (nếu có) sẽ được hiển thị cụ thể tại bước thanh toán.</li>
            <li>BlueWear luôn nỗ lực đảm bảo hiển thị giá cả chính xác nhất. Tuy nhiên, trong trường hợp có lỗi kỹ thuật hiển thị sai giá sản phẩm, chúng tôi có quyền từ chối hoặc hủy bỏ đơn hàng đó và sẽ thông báo kịp thời cho quý khách.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">4. Đặt hàng và xác nhận đơn hàng</h2>
          <p>
            Khi quý khách đặt hàng trên hệ thống, hệ thống sẽ gửi email hoặc thông báo xác nhận tiếp nhận đơn hàng. Hợp đồng mua bán chính thức được thiết lập khi đơn hàng của quý khách được chuyển sang trạng thái xác nhận giao hàng thành công từ phía BlueWear.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">5. Quyền sở hữu trí tuệ</h2>
          <p>
            Toàn bộ nội dung hiển thị trên website BlueWear bao gồm nhưng không giới hạn ở: logo, hình ảnh sản phẩm, thiết kế giao diện, video, mã nguồn và nội dung văn bản đều thuộc quyền sở hữu độc quyền của thương hiệu BlueWear. Mọi hành vi sao chép, tái sử dụng hoặc khai thác thương mại khi chưa có sự chấp thuận bằng văn bản đều là vi phạm pháp luật.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">6. Thay đổi điều khoản</h2>
          <p>
            BlueWear có quyền điều chỉnh, sửa đổi các điều khoản sử dụng này bất cứ lúc nào tùy theo định hướng phát triển hoặc quy định pháp luật. Các thay đổi sẽ có hiệu lực ngay khi được đăng tải công khai trên website chính thức.
          </p>
        </section>
      </div>
    </div>
  );
}