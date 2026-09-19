import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL!;

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🌱 Starting seed...");

  // ============================================================
  // 1. CATEGORY
  // ============================================================

  const ao = await prisma.category.upsert({
    where: {
      slug: "ao",
    },
    update: {},
    create: {
      name: "Áo",
      slug: "ao",
    },
  });

  const quan = await prisma.category.upsert({
    where: {
      slug: "quan",
    },
    update: {},
    create: {
      name: "Quần",
      slug: "quan",
    },
  });

  const vay = await prisma.category.upsert({
    where: {
      slug: "vay",
    },
    update: {},
    create: {
      name: "Váy",
      slug: "vay",
    },
  });

  console.log("✓ Categories created");


  // ============================================================
  // 2. COLLECTION
  // ============================================================

  const collection = await prisma.collection.upsert({
    where: {
      slug: "thu-dong-2026",
    },
    update: {},
    create: {
      name: "Thu Đông 2026",
      slug: "thu-dong-2026",
      season: "FALL_WINTER",
      year: 2026,
      description: "Bộ sưu tập thời trang Thu Đông 2026",
      bannerUrl: "/images/collections/fall-winter-2026.jpg",
      startsAt: new Date("2026-09-01"),
      isActive: true,
    },
  });

  console.log("✓ Collection created");


  // ============================================================
  // 3. SIZE
  // ============================================================

  const sizeS = await prisma.size.upsert({
    where: {
      label: "S",
    },
    update: {},
    create: {
      label: "S",
      sortOrder: 1,
    },
  });

  const sizeM = await prisma.size.upsert({
    where: {
      label: "M",
    },
    update: {},
    create: {
      label: "M",
      sortOrder: 2,
    },
  });

  const sizeL = await prisma.size.upsert({
    where: {
      label: "L",
    },
    update: {},
    create: {
      label: "L",
      sortOrder: 3,
    },
  });

  const sizeXL = await prisma.size.upsert({
    where: {
      label: "XL",
    },
    update: {},
    create: {
      label: "XL",
      sortOrder: 4,
    },
  });

  console.log("✓ Sizes created");


  // ============================================================
  // 4. COLOR
  // ============================================================

  const black = await prisma.color.upsert({
    where: {
      name: "Đen",
    },
    update: {},
    create: {
      name: "Đen",
      hexCode: "#000000",
    },
  });

  const white = await prisma.color.upsert({
    where: {
      name: "Trắng",
    },
    update: {},
    create: {
      name: "Trắng",
      hexCode: "#FFFFFF",
    },
  });

  const beige = await prisma.color.upsert({
    where: {
      name: "Be",
    },
    update: {},
    create: {
      name: "Be",
      hexCode: "#F5F0E6",
    },
  });

  const brown = await prisma.color.upsert({
    where: {
      name: "Nâu",
    },
    update: {},
    create: {
      name: "Nâu",
      hexCode: "#8B5E3C",
    },
  });

  console.log("✓ Colors created");


  // ============================================================
  // 5. PRODUCTS
  // ============================================================

  const tshirt = await prisma.product.upsert({
    where: {
      slug: "basic-unisex-tshirt",
    },
    update: {},
    create: {
      name: "Basic Unisex T-Shirt",
      slug: "basic-unisex-tshirt",
      description:
        "Áo thun basic unisex phù hợp cho phong cách hàng ngày.",
      price: 199000,
      salePrice: 169000,

      categoryId: ao.id,
      collectionId: collection.id,

      isActive: true,
    },
  });

  const hoodie = await prisma.product.upsert({
    where: {
      slug: "oversize-hoodie",
    },
    update: {},
    create: {
      name: "Oversize Hoodie",
      slug: "oversize-hoodie",
      description:
        "Áo hoodie oversize phong cách trẻ trung.",
      price: 499000,
      salePrice: 449000,

      categoryId: ao.id,
      collectionId: collection.id,

      isActive: true,
    },
  });

  const pants = await prisma.product.upsert({
    where: {
      slug: "straight-cargo-pants",
    },
    update: {},
    create: {
      name: "Straight Cargo Pants",
      slug: "straight-cargo-pants",
      description:
        "Quần cargo dáng straight phù hợp phong cách casual.",
      price: 399000,

      categoryId: quan.id,
      collectionId: collection.id,

      isActive: true,
    },
  });

  const dress = await prisma.product.upsert({
    where: {
      slug: "minimal-midi-dress",
    },
    update: {},
    create: {
      name: "Minimal Midi Dress",
      slug: "minimal-midi-dress",
      description:
        "Váy midi tối giản, phù hợp nhiều dịp.",
      price: 459000,
      salePrice: 419000,

      categoryId: vay.id,
      collectionId: collection.id,

      isActive: true,
    },
  });

  console.log("✓ Products created");


  // ============================================================
  // 6. PRODUCT VARIANTS
  // ============================================================

  const tshirtBlackM = await prisma.productVariant.upsert({
    where: {
      sku: "TSHIRT-BLK-M",
    },
    update: {},
    create: {
      productId: tshirt.id,
      sizeId: sizeM.id,
      colorId: black.id,
      sku: "TSHIRT-BLK-M",
      stockQuantity: 20,
    },
  });

  await prisma.productVariant.upsert({
    where: {
      sku: "TSHIRT-BLK-S",
    },
    update: {},
    create: {
      productId: tshirt.id,
      sizeId: sizeS.id,
      colorId: black.id,
      sku: "TSHIRT-BLK-S",
      stockQuantity: 15,
    },
  });

  await prisma.productVariant.upsert({
    where: {
      sku: "TSHIRT-WHT-M",
    },
    update: {},
    create: {
      productId: tshirt.id,
      sizeId: sizeM.id,
      colorId: white.id,
      sku: "TSHIRT-WHT-M",
      stockQuantity: 18,
    },
  });

  await prisma.productVariant.upsert({
    where: {
      sku: "TSHIRT-WHT-L",
    },
    update: {},
    create: {
      productId: tshirt.id,
      sizeId: sizeL.id,
      colorId: white.id,
      sku: "TSHIRT-WHT-L",
      stockQuantity: 12,
    },
  });


  // Hoodie

  await prisma.productVariant.upsert({
    where: {
      sku: "HOODIE-BRN-M",
    },
    update: {},
    create: {
      productId: hoodie.id,
      sizeId: sizeM.id,
      colorId: brown.id,
      sku: "HOODIE-BRN-M",
      stockQuantity: 10,
    },
  });

  await prisma.productVariant.upsert({
    where: {
      sku: "HOODIE-BRN-L",
    },
    update: {},
    create: {
      productId: hoodie.id,
      sizeId: sizeL.id,
      colorId: brown.id,
      sku: "HOODIE-BRN-L",
      stockQuantity: 8,
    },
  });

  await prisma.productVariant.upsert({
    where: {
      sku: "HOODIE-BEI-M",
    },
    update: {},
    create: {
      productId: hoodie.id,
      sizeId: sizeM.id,
      colorId: beige.id,
      sku: "HOODIE-BEI-M",
      stockQuantity: 7,
    },
  });


  // Pants

  await prisma.productVariant.upsert({
    where: {
      sku: "PANTS-BLK-M",
    },
    update: {},
    create: {
      productId: pants.id,
      sizeId: sizeM.id,
      colorId: black.id,
      sku: "PANTS-BLK-M",
      stockQuantity: 10,
    },
  });

  await prisma.productVariant.upsert({
    where: {
      sku: "PANTS-BLK-L",
    },
    update: {},
    create: {
      productId: pants.id,
      sizeId: sizeL.id,
      colorId: black.id,
      sku: "PANTS-BLK-L",
      stockQuantity: 10,
    },
  });


  // Dress

  await prisma.productVariant.upsert({
    where: {
      sku: "DRESS-BEI-S",
    },
    update: {},
    create: {
      productId: dress.id,
      sizeId: sizeS.id,
      colorId: beige.id,
      sku: "DRESS-BEI-S",
      stockQuantity: 6,
    },
  });

  await prisma.productVariant.upsert({
    where: {
      sku: "DRESS-BEI-M",
    },
    update: {},
    create: {
      productId: dress.id,
      sizeId: sizeM.id,
      colorId: beige.id,
      sku: "DRESS-BEI-M",
      stockQuantity: 8,
    },
  });

  console.log("✓ Product variants created");


  // ============================================================
  // 7. PRODUCT IMAGES
  // ============================================================

  await prisma.productImage.createMany({
    data: [
      {
        productId: tshirt.id,
        colorId: black.id,
        url: "/images/products/basic-tshirt-black.jpg",
        altText: "Basic Unisex T-Shirt màu đen",
        sortOrder: 1,
      },
      {
        productId: tshirt.id,
        colorId: white.id,
        url: "/images/products/basic-tshirt-white.jpg",
        altText: "Basic Unisex T-Shirt màu trắng",
        sortOrder: 2,
      },
      {
        productId: hoodie.id,
        colorId: brown.id,
        url: "/images/products/hoodie-brown.jpg",
        altText: "Oversize Hoodie màu nâu",
        sortOrder: 1,
      },
      {
        productId: hoodie.id,
        colorId: beige.id,
        url: "/images/products/hoodie-beige.jpg",
        altText: "Oversize Hoodie màu be",
        sortOrder: 2,
      },
      {
        productId: pants.id,
        colorId: black.id,
        url: "/images/products/cargo-black.jpg",
        altText: "Straight Cargo Pants màu đen",
        sortOrder: 1,
      },
      {
        productId: dress.id,
        colorId: beige.id,
        url: "/images/products/midi-dress-beige.jpg",
        altText: "Minimal Midi Dress màu be",
        sortOrder: 1,
      },
    ],
    skipDuplicates: true,
  });

  console.log("✓ Product images created");


  // ============================================================
  // 8. USER
  // ============================================================

  const user = await prisma.user.upsert({
    where: {
      email: "customer@example.com",
    },
    update: {},
    create: {
      email: "customer@example.com",
      passwordHash: "SEED_PASSWORD_NOT_FOR_PRODUCTION",
      fullName: "Nguyen Van A",
      phone: "0900000000",
      role: "CUSTOMER",
    },
  });

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@example.com",
    },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash: "SEED_ADMIN_PASSWORD_NOT_FOR_PRODUCTION",
      fullName: "Admin",
      phone: "0911111111",
      role: "ADMIN",
    },
  });

  console.log("✓ Users created");


  // ============================================================
  // 9. ADDRESS
  // ============================================================

  const address = await prisma.address.create({
    data: {
      userId: user.id,
      recipientName: "Nguyen Van A",
      phone: "0900000000",
      fullAddress: "123 Nguyen Hue, Quan 1, TP. Ho Chi Minh",
      isDefault: true,
    },
  });

  console.log("✓ Address created");


  // ============================================================
  // 10. CART + CART ITEM
  // ============================================================

  const cart = await prisma.cart.upsert({
    where: {
      userId: user.id,
    },
    update: {},
    create: {
      userId: user.id,
    },
  });

  await prisma.cartItem.upsert({
    where: {
      cartId_variantId: {
        cartId: cart.id,
        variantId: tshirtBlackM.id,
      },
    },
    update: {
      quantity: 2,
    },
    create: {
      cartId: cart.id,
      variantId: tshirtBlackM.id,
      quantity: 2,
    },
  });

  console.log("✓ Cart created");


  // ============================================================
  // 11. COUPON
  // ============================================================

  const coupon = await prisma.coupon.upsert({
    where: {
      code: "SALE20",
    },
    update: {},
    create: {
      code: "SALE20",
      description: "Giảm 20% cho đơn hàng mẫu",
      discountType: "PERCENT",
      discountValue: 20,
      minOrderAmount: 300000,
      maxDiscountAmount: 100000,
      maxUses: 100,
      usedCount: 0,
      startsAt: new Date("2026-01-01"),
      endsAt: new Date("2026-12-31"),
      isActive: true,
    },
  });

  console.log("✓ Coupon created");


  // ============================================================
  // 12. ORDER
  // ============================================================

  const order = await prisma.order.upsert({
    where: {
      orderCode: "DH20260919001",
    },
    update: {},
    create: {
      orderCode: "DH20260919001",

      userId: user.id,
      couponId: coupon.id,

      recipientName: "Nguyen Van A",
      recipientPhone: "0900000000",
      shippingAddress:
        "123 Nguyen Hue, Quan 1, TP. Ho Chi Minh",

      subtotal: 398000,
      discountAmount: 79600,
      shippingFee: 30000,
      totalAmount: 348400,

      status: "CONFIRMED",

      note: "Đơn hàng mẫu để test",
    },
  });

  console.log("✓ Order created");


  // ============================================================
  // 13. ORDER ITEM
  // ============================================================

  const existingOrderItem = await prisma.orderItem.findFirst({
    where: {
      orderId: order.id,
      variantId: tshirtBlackM.id,
    },
  });

  if (!existingOrderItem) {
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        variantId: tshirtBlackM.id,

        productName: "Basic Unisex T-Shirt",
        sizeLabel: "M",
        colorName: "Đen",
        unitPrice: 199000,
        quantity: 2,
      },
    });
  }

  console.log("✓ Order item created");


  // ============================================================
  // 14. PAYMENT
  // ============================================================

  await prisma.payment.upsert({
    where: {
      orderId: order.id,
    },
    update: {},
    create: {
      orderId: order.id,
      method: "COD",
      status: "UNPAID",
      amount: 348400,
    },
  });

  console.log("✓ Payment created");


  // ============================================================
  // DONE
  // ============================================================

  console.log("");
  console.log("====================================");
  console.log("🌱 Seed completed successfully!");
  console.log("====================================");
  console.log("");
  console.log("Sample accounts:");
  console.log("Customer: customer@example.com");
  console.log("Admin:    admin@example.com");
  console.log("");
  console.log("Products:");
  console.log("- Basic Unisex T-Shirt");
  console.log("- Oversize Hoodie");
  console.log("- Straight Cargo Pants");
  console.log("- Minimal Midi Dress");
  console.log("");
}


// ============================================================
// RUN
// ============================================================

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });