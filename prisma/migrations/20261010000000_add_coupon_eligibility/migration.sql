-- CreateEnum
CREATE TYPE "CouponScope" AS ENUM ('PRODUCT', 'SHIPPING');

-- AlterTable
ALTER TABLE "coupons"
ADD COLUMN "scope" "CouponScope" NOT NULL DEFAULT 'PRODUCT',
ADD COLUMN "required_payment_method" "PaymentMethod";
