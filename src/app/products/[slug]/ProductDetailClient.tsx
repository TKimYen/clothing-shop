"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ProductDetail } from "@/src/lib/product-detail";

type ProductDetailClientProps = {
  product: ProductDetail;
};

function formatPrice(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const colorOptions = useMemo(
    () =>
      product.variants.filter(
        (variant, index, variants) =>
          variants.findIndex((item) => item.color.id === variant.color.id) === index,
      ),
    [product.variants],
  );
  const sizeOptions = useMemo(
    () =>
      product.variants.filter(
        (variant, index, variants) =>
          variants.findIndex((item) => item.size.id === variant.size.id) === index,
      ),
    [product.variants],
  );
  const firstAvailableVariant =
    product.variants.find((variant) => variant.stockQuantity > 0) ?? product.variants[0];
  const [selectedColorId, setSelectedColorId] = useState(
    firstAvailableVariant?.color.id ?? "",
  );
  const [selectedSizeId, setSelectedSizeId] = useState(
    firstAvailableVariant?.size.id ?? "",
  );
  const [selectedImageId, setSelectedImageId] = useState(product.images[0]?.id ?? "");
  const [addedToCart, setAddedToCart] = useState(false);

  const selectedVariant = product.variants.find(
    (variant) =>
      variant.color.id === selectedColorId && variant.size.id === selectedSizeId,
  );
  const colorImages = product.images.filter(
    (image) => image.colorId === selectedColorId,
  );
  const commonImages = product.images.filter((image) => image.colorId === null);
  const activeImages = colorImages.length > 0 ? colorImages : commonImages.length > 0 ? commonImages : product.images;
  const selectedImage =
    activeImages.find((image) => image.id === selectedImageId) ?? activeImages[0];

  const isSizeAvailable = (sizeId: string) =>
    product.variants.some(
      (variant) =>
        variant.color.id === selectedColorId &&
        variant.size.id === sizeId &&
        variant.stockQuantity > 0,
    );

  const handleColorChange = (colorId: string) => {
    const nextSize = product.variants.find(
      (variant) => variant.color.id === colorId && variant.stockQuantity > 0,
    );
    setSelectedColorId(colorId);
    setSelectedSizeId(nextSize?.size.id ?? "");
    setAddedToCart(false);
  };

  const handleAddToCart = () => {
    if (!selectedVariant || selectedVariant.stockQuantity < 1) {
      return;
    }

    const storedItems = window.localStorage.getItem("bluewear-cart");
    const cartItems = storedItems ? JSON.parse(storedItems) as Array<{ variantId: string; quantity: number }> : [];
    const existingItem = cartItems.find((item) => item.variantId === selectedVariant.id);

    if (existingItem) {
      existingItem.quantity = Math.min(
        existingItem.quantity + 1,
        selectedVariant.stockQuantity,
      );
    } else {
      cartItems.push({ variantId: selectedVariant.id, quantity: 1 });
    }

    window.localStorage.setItem("bluewear-cart", JSON.stringify(cartItems));
    setAddedToCart(true);
  };

  const displayPrice = product.salePrice ?? product.price;

  return (
    <main className="container mx-auto px-4 py-8">
      <Link href="/products" className="text-sm text-[#17579B] hover:underline">
        ← Quay lại sản phẩm
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <section>
          <div className="aspect-[4/5] overflow-hidden rounded-xl bg-gray-100">
            {selectedImage ? (
              <img
                src={selectedImage.url}
                alt={selectedImage.altText ?? product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                Chưa có hình ảnh
              </div>
            )}
          </div>
          {activeImages.length > 1 ? (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {activeImages.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setSelectedImageId(image.id)}
                  className={`aspect-square overflow-hidden rounded-lg border-2 ${selectedImage?.id === image.id ? "border-[#17579B]" : "border-transparent"}`}
                  aria-label={`Xem ảnh ${image.altText ?? product.name}`}
                >
                  <img src={image.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section>
          <p className="text-sm uppercase tracking-wide text-gray-500">Chi tiết sản phẩm</p>
          <h1 className="mt-2 text-3xl font-bold text-[#164F8D]">{product.name}</h1>
          <div className="mt-4 flex items-center gap-3">
            <p className="text-2xl font-bold text-[#164F8D]">{formatPrice(displayPrice)}</p>
            {product.salePrice !== null ? (
              <p className="text-sm text-gray-400 line-through">{formatPrice(product.price)}</p>
            ) : null}
          </div>
          <p className="mt-6 leading-7 text-gray-600">
            {product.description ?? "Sản phẩm thời trang unisex của BlueWear."}
          </p>

          <div className="mt-8 border-t pt-6">
            <p className="mb-3 font-semibold text-gray-800">Màu: {colorOptions.find((item) => item.color.id === selectedColorId)?.color.name}</p>
            <div className="flex flex-wrap gap-3">
              {colorOptions.map((variant) => (
                <button
                  key={variant.color.id}
                  type="button"
                  onClick={() => handleColorChange(variant.color.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${selectedColorId === variant.color.id ? "border-[#17579B] ring-2 ring-[#dbeafe]" : "border-gray-200"}`}
                >
                  <span
                    className="h-5 w-5 rounded-full border border-gray-300"
                    style={{ backgroundColor: variant.color.hexCode }}
                  />
                  {variant.color.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-3 font-semibold text-gray-800">Size</p>
            <div className="flex flex-wrap gap-3">
              {sizeOptions.map((variant) => {
                const available = isSizeAvailable(variant.size.id);
                return (
                  <button
                    key={variant.size.id}
                    type="button"
                    disabled={!available}
                    onClick={() => {
                      setSelectedSizeId(variant.size.id);
                      setAddedToCart(false);
                    }}
                    className={`min-w-14 rounded-lg border px-4 py-2 text-sm font-medium ${selectedSizeId === variant.size.id ? "border-[#17579B] bg-[#17579B] text-white" : "border-gray-200 text-gray-700"} ${!available ? "cursor-not-allowed opacity-40 line-through" : "hover:border-[#17579B]"}`}
                  >
                    {variant.size.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-gray-50 px-4 py-3 text-sm">
            {selectedVariant && selectedVariant.stockQuantity > 0 ? (
              <span className="font-medium text-green-700">✓ Còn {selectedVariant.stockQuantity} sản phẩm</span>
            ) : (
              <span className="font-medium text-red-600">Hết hàng với lựa chọn này</span>
            )}
          </div>

          <button
            type="button"
            disabled={!selectedVariant || selectedVariant.stockQuantity < 1}
            onClick={handleAddToCart}
            className="mt-6 w-full rounded-lg bg-[#17579B] px-6 py-3.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {addedToCart ? "Đã thêm vào giỏ hàng" : "Thêm vào giỏ hàng"}
          </button>
          {addedToCart ? (
            <Link href="/cart" className="mt-3 block text-center text-sm font-medium text-[#17579B] hover:underline">
              Xem giỏ hàng
            </Link>
          ) : null}
        </section>
      </div>
    </main>
  );
}