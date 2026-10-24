-- Sắp xếp tên theo tiếng Việt (Áo, Đen... đứng đúng vị trí, không phân biệt hoa/thường)
ALTER TABLE "products" ALTER COLUMN "name" TYPE TEXT COLLATE "vi-VN-x-icu";
ALTER TABLE "categories" ALTER COLUMN "name" TYPE TEXT COLLATE "vi-VN-x-icu";
ALTER TABLE "colors" ALTER COLUMN "name" TYPE TEXT COLLATE "vi-VN-x-icu";
ALTER TABLE "collections" ALTER COLUMN "name" TYPE TEXT COLLATE "vi-VN-x-icu";
ALTER TABLE "users" ALTER COLUMN "full_name" TYPE TEXT COLLATE "vi-VN-x-icu";
ALTER TABLE "orders" ALTER COLUMN "recipient_name" TYPE TEXT COLLATE "vi-VN-x-icu";
