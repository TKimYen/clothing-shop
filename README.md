# BlueWear — Clothing Shop

Web bán quần áo unisex: Next.js 16 (App Router) + Prisma 7 + PostgreSQL (Neon) + Clerk.
Gồm **site bán hàng** (`/`) và **trang quản trị** (`/admin`).

> Hướng dẫn tạo Git branch / Neon branch / `.env` cho thành viên mới: xem [SETUP.md](./SETUP.md).

## Chạy dự án

```bash
npm install
npx prisma generate
npx prisma migrate deploy   # áp dụng migration lên database trong .env
npm run dev                 # http://localhost:3000
```

Biến môi trường (`.env`):

| Biến | Ý nghĩa |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | Kết nối PostgreSQL (Neon) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Đăng nhập Clerk |
| `ADMIN_AUTH_DISABLED` | `true` = bỏ kiểm tra quyền admin. **Chỉ dùng khi dev**, bị bỏ qua khi `NODE_ENV=production` |

### Cấp quyền admin

Trang `/admin` và mọi API `/api/admin/*` yêu cầu đăng nhập Clerk **và** user trong bảng `users` có `role = ADMIN`.
Đăng nhập một lần trên site (để user được đồng bộ vào DB), rồi đổi `role` của user đó thành `ADMIN` (vd. bằng `npx prisma studio`).

---

## Nghiệp vụ

### Sản phẩm, biến thể, hình ảnh

- **Giá nằm ở Product, không nằm ở Variant.** Product có `price`, `salePrice` (phải nhỏ hơn `price`) và khung giờ khuyến mãi `saleStartsAt`/`saleEndsAt` (phải nhập đủ cả hai hoặc bỏ trống cả hai; ngày kết thúc sau ngày bắt đầu).
- **Variant** = một tổ hợp *sản phẩm + size + màu* có thể bán được, có `sku` và `stockQuantity`.
  - Không được trùng tổ hợp (product + size + color). SKU là duy nhất toàn hệ thống.
  - Mỗi sản phẩm phải có ít nhất 1 variant.
- **Hình ảnh** gắn theo *sản phẩm + màu* (không gắn theo variant). `colorId` để trống = ảnh dùng chung cho mọi màu. Ảnh gắn màu thì màu đó phải có ít nhất một variant.
- Sản phẩm `isActive = false` bị ẩn khỏi site bán hàng.

### Tồn kho & nhập hàng

Tồn kho (`ProductVariant.stockQuantity`) **không được sửa tay**.

1. **Thêm sản phẩm / variant không có ô số lượng.** Ô số lượng bị ẩn khi thêm; variant mới luôn được lưu với tồn kho = 0. Khi sửa sản phẩm, variant đã lưu chỉ hiển thị tồn kho (không sửa được).
2. **Tồn kho chỉ tăng khi nhập hàng.** Admin tạo **phiếu nhập hàng** (`StockImport`) ở:
   - menu **Stock imports** → **New stock import** → chọn sản phẩm; hoặc
   - trang chi tiết sản phẩm → nút **Receive stock** (sản phẩm đã được chọn sẵn).

   Trong phiếu:
   - **Nhập cho cả sản phẩm:** ô *Quantity for all variants* + **Apply to all** điền cùng một số lượng cho mọi variant của sản phẩm.
   - **Nhập cho từng variant:** sửa số lượng từng dòng (để trống hoặc 0 = không nhập variant đó), giá vốn/đơn vị (tuỳ chọn) và ghi chú (nhà cung cấp, số phiếu giao…).
   - Mỗi dòng phải có số lượng ≥ 1; phiếu phải có ít nhất 1 dòng; một variant không xuất hiện 2 lần trong cùng phiếu.
   - Khi lưu, hệ thống tạo phiếu có mã `NHyyyymmdd-XXXX`, ghi lại người tạo và **cộng số lượng vào tồn kho của từng variant trong cùng một transaction** (lỗi thì không dòng nào được cộng).
   - Phiếu nhập **không sửa, không xoá** để giữ lịch sử tồn kho. Xem toàn bộ phiếu ở trang **Stock imports** (tìm theo mã phiếu/ghi chú), hoặc lịch sử của một sản phẩm ở tab **Stock history**.
3. **Tồn kho chỉ giảm khi bán hàng** (luồng đặt hàng/checkout), không giảm từ trang admin.
4. **Variant đã có lịch sử** (đã có trong đơn hàng hoặc phiếu nhập):
   - không được xoá khỏi sản phẩm;
   - không được đổi size/màu (vì đơn hàng và phiếu nhập cũ sẽ trỏ sai mặt hàng) — muốn bán tổ hợp khác thì thêm variant mới. Vẫn được đổi SKU.
5. Dashboard cảnh báo **tồn kho thấp** cho variant có tồn kho < 10.

### Danh mục, bộ sưu tập, size, màu

- **Category**: `name`, `slug` (slug duy nhất, chữ thường, số và dấu `-`).
- **Collection**: `name`, `slug`, `season` (`SPRING_SUMMER` / `FALL_WINTER`), `year`, `description`, `bannerUrl`, `startsAt`, `isActive`. Sản phẩm có thể không thuộc bộ sưu tập nào.
- **Size**: `label` (duy nhất), `sortOrder` để sắp xếp S < M < L trên giao diện.
- **Color**: `name` (duy nhất), `hexCode` dùng vẽ ô màu.
- **Không xoá được** category / collection / size / color khi vẫn còn sản phẩm hoặc variant đang dùng.

### Mã giảm giá (Coupon)

- `code` lưu chữ IN HOA, duy nhất.
- `discountType`: `PERCENT` (giá trị 0–100, có thể đặt trần `maxDiscountAmount`) hoặc `FIXED` (số tiền cố định; nếu có `maxDiscountAmount` thì không nhỏ hơn giá trị giảm).
- `minOrderAmount`: giá trị đơn tối thiểu. `maxUses`: số lượt tối đa, để trống = không giới hạn.
- `endsAt` phải sau `startsAt`. `isActive = false` thì không áp dụng được.
- `usedCount` **chỉ đọc**, do luồng đặt hàng tăng; admin không sửa.
- Coupon đã được dùng trong đơn hàng **không xoá được** — tắt `isActive` thay vì xoá.

### Đơn hàng

- Đơn lưu **snapshot** tại thời điểm đặt: người nhận, SĐT, địa chỉ giao (không liên kết `Address` hiện tại của khách), và từng dòng hàng (tên sản phẩm, size, màu, đơn giá, số lượng). Sửa sản phẩm/địa chỉ sau này không làm thay đổi đơn cũ.
- `totalAmount = subtotal − discountAmount + shippingFee`.
- Admin chỉ được đổi **trạng thái**, theo đúng luồng:

  ```
  PENDING → CONFIRMED → SHIPPING → DELIVERED
      └──────────┴───────────┴──→ CANCELLED   (từ mọi trạng thái chưa DELIVERED)
  ```

  Không được nhảy cóc, không lùi trạng thái; `DELIVERED` và `CANCELLED` là trạng thái cuối.
- Đơn **COD** chuyển sang `DELIVERED` thì thanh toán tự chuyển `PAID` và ghi `paidAt`.
- **Doanh thu** = tổng `totalAmount` của các đơn **không** bị huỷ.
- Sản phẩm đã có trong đơn hàng **không xoá được** — chuyển sang không hoạt động (`isActive = false`).

### Người dùng

- Tài khoản do Clerk quản lý; user được đồng bộ vào bảng `users` khi đăng nhập.
- Admin chỉ được **đổi role** (`CUSTOMER` ↔ `ADMIN`); không tự gỡ quyền ADMIN của chính mình.
- Địa chỉ của khách và lịch sử đơn hàng **chỉ xem**, admin không sửa địa chỉ khách.

---

## Trang quản trị (`/admin`)

| Trang | Chức năng |
|---|---|
| Dashboard | Tổng user / sản phẩm / danh mục / đơn / doanh thu, đơn theo trạng thái, đơn gần đây, tồn kho thấp |
| Products | Danh sách (tìm, lọc category/collection/active, sắp xếp), thêm/sửa (Info · Variants · Images), chi tiết, **nhập hàng**, lịch sử nhập |
| Stock imports | Danh sách phiếu nhập hàng, tạo phiếu nhập (cho cả sản phẩm hoặc từng variant) |
| Categories · Collections · Sizes · Colors | CRUD |
| Coupons | CRUD |
| Orders | Danh sách (tìm theo mã đơn/khách, lọc trạng thái), chi tiết, đổi trạng thái |
| Users | Danh sách (tìm, lọc role), đổi role, chi tiết + địa chỉ + lịch sử đơn |

### API admin

Tất cả nằm dưới `/api/admin`, yêu cầu quyền ADMIN, trả về `{ success: true, data }` hoặc `{ success: false, error: { message, fields? } }`.
Danh sách nhận `?page&pageSize&search&sort&dir` và các tham số lọc, trả về `{ items, total, page, pageSize }`.

| Endpoint | Mô tả |
|---|---|
| `GET /dashboard` | Số liệu dashboard |
| `GET, POST /categories` · `GET, PUT, DELETE /categories/:id` · `GET /categories/counts` | Danh mục |
| `GET, POST /collections` · `GET, PUT, DELETE /collections/:id` · `GET /collections/counts` | Bộ sưu tập |
| `GET, POST /sizes` · `GET, PUT, DELETE /sizes/:id` · `GET /sizes/counts` | Size |
| `GET, POST /colors` · `GET, PUT, DELETE /colors/:id` · `GET /colors/counts` | Màu |
| `GET, POST /coupons` · `GET, PUT, DELETE /coupons/:id` | Mã giảm giá |
| `GET, POST /products` · `GET, PUT, DELETE /products/:id` · `GET /products/options` | Sản phẩm (kèm variants, images; **không** nhận `stockQuantity`) |
| `GET, POST /stock-imports` | Phiếu nhập hàng (`?productId=` để lọc theo sản phẩm). Body POST: `{ note, items: [{ variantId, quantity, unitCost }] }` |
| `GET /orders` · `GET /orders/:id` · `PATCH /orders/:id/status` | Đơn hàng, đổi trạng thái |
| `GET /users` · `GET /users/:id` · `GET /users/:id/stats` · `PATCH /users/:id/role` | Người dùng, đổi role |

### Cấu trúc mã admin

```
src/app/admin/**              Giao diện các trang admin
src/app/api/admin/**          Route API admin
src/components/admin, ui      Component giao diện admin
src/lib/admin/server.ts       Kiểm tra quyền, xử lý lỗi, phân trang
src/lib/admin/validators.ts   Validate body API (zod)
src/lib/admin/mappers.ts      Prisma → dữ liệu trả về cho UI
src/lib/admin/products.ts     Tạo/sửa sản phẩm + variant, tạo phiếu nhập hàng
src/lib/services/*            Client gọi API (dùng trong UI)
src/lib/schemas/*             Validate form (zod)
```
