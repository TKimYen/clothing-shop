# Clothing Shop — Team Setup Guide

Hướng dẫn nhanh để thành viên mới clone project, tạo **Git branch riêng** và **Neon database branch riêng**, tránh làm ảnh hưởng tới code/dữ liệu của người khác.

## Nguyên tắc chung

- **Git branch** = nhánh code bạn đang sửa.
- **Neon branch** = database riêng bạn đang kết nối tới.
- Hai cái này **độc lập nhau** — đổi Git branch không tự đổi database, phải tự kiểm tra `.env`.
- Mỗi người: 1 Git feature branch + 1 Neon dev branch riêng.
- **Không** test dữ liệu cá nhân trên Neon `production`.

## 1. Yêu cầu môi trường

| Công nghệ | Version |
|---|---|
| Node.js | 24.18.0 |
| Next.js | 16.3.5 |
| TypeScript | 5.9.3 |
| Prisma / @prisma/client / @prisma/adapter-pg | 7.10.0 |
| pg | 8.23.0 |

Kiểm tra: `node -v`, `npm -v`, `npx prisma -v`

## 2. Clone project & cài đặt

```bash
git clone https://github.com/TKimYen/clothing-shop.git
cd clothing-shop
npm install
```

## 3. Tạo Git branch riêng

Không code trực tiếp trên `main`:

```bash
git checkout main
git pull origin main
git checkout -b feature/ten-task
```

Branch gợi ý theo nhóm:

| Thành viên | Git branch | Việc |
|---|---|---|
| Member 1 | `feature/product-api` | Product / Category API |
| Member 2 | `feature/product-ui` | Product UI |
| Member 3 | `feature/auth-cart` | Auth / User / Cart |
| Member 4 | `feature/checkout-admin` | Checkout / Admin |

Push branch lần đầu: `git push -u origin feature/ten-task`

## 4. Tạo Neon branch riêng

Vào Neon → project `clothing-online` → **Branches** → **Create new branch**:

- Đặt tên branch
- Parent branch: chọn `production`
- Chọn **Branch data and schema** (để có sẵn schema + data hiện tại từ production, sửa gì trên đây không ảnh hưởng production)
- Nếu dùng lâu dài: Auto-delete → **Never**

## 5. Lấy connection string & tạo `.env`

Vào branch của bạn → **Connect** → copy connection string.

Tạo file `.env` ở thư mục gốc project:

```
DATABASE_URL="CONNECTION_STRING_CUA_NEON_DEV"
DIRECT_URL="DIRECT_CONNECTION_STRING_CUA_NEON_DEV"
```

## 6. Chạy Prisma & kiểm tra

```bash
npx prisma generate       # tạo Prisma Client
npx prisma migrate status # kiểm tra migration đã áp dụng chưa
npx prisma studio         # mở giao diện xem database
```

Nếu Prisma Studio hiện các bảng `users`, `products`, `orders`... là ổn.

## 7. Chạy project

```bash
npm run dev
```

Mở `http://localhost:3000`

**Cách dữ liệu chảy:** Next.js → Prisma → đọc `.env` (`DATABASE_URL` / `DIRECT_URL`) → kết nối tới Neon branch tương ứng.

## 8. Cách biết mình đang dùng Neon branch nào

Git branch **không** quyết định database — chỉ `.env` quyết định. Ví dụ đang ở Git branch `feature/product-api` nhưng nếu `.env` trỏ `production`, thì bạn **đang thao tác trên production**. Luôn kiểm tra `.env` trước khi sửa/xóa dữ liệu.

## 9. Quy trình làm việc hằng ngày

```bash
git checkout main
git pull origin main
git checkout feature/ten-task     # quay lại branch đang làm
# kiểm tra .env vẫn trỏ Neon dev branch cá nhân, không phải production
npm run dev                       # code + test
git status
git add .
git commit -m "feat: mo ta thay doi"
git push
```

Sau đó tạo **Pull Request** trên GitHub → review → merge vào `main`. Không push thẳng vào `main`.

## 10. Khi cần đổi database schema

```bash
# 1. Sửa prisma/schema.prisma
# 2. Tạo migration trên Neon dev branch cá nhân
npx prisma migrate dev --name mo_ta_thay_doi
# 3. Test xong thì commit cả schema lẫn migration
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: mo ta thay doi schema"
git push
```

Tạo Pull Request để nhóm review. Migration là một phần source code nên **bắt buộc commit** thư mục `prisma/migrations`.

## 11. Không được làm

- ❌ Test/thêm/xóa dữ liệu cá nhân trên Neon `production` → dùng Neon dev branch riêng.
- ❌ Commit `.env`, password, connection string, API key lên GitHub.
- ❌ Tự ý nâng version Prisma (`npm install prisma@latest`...) — hiện đang cố định ở **7.10.0**, đổi phải thống nhất cả nhóm.
- ❌ Push thẳng vào `main`.

## 12. Checklist nhanh

- [ ] Cài Node.js 24.18.0, Git
- [ ] Clone repo, `npm install`
- [ ] Tạo Neon branch riêng (từ `production`, giữ data + schema)
- [ ] Lấy `DATABASE_URL` + `DIRECT_URL`, điền vào `.env`
- [ ] `npx prisma generate`
- [ ] `npx prisma migrate status` (và `npx prisma studio` để kiểm tra)
- [ ] Tạo Git feature branch trước khi code
- [ ] `npm run dev` → mở `http://localhost:3000`
- [ ] `npm run build` chạy được không lỗi