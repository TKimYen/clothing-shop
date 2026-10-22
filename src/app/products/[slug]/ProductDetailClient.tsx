"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ProductDetail } from "@/src/lib/product-detail";

type ProductDetailClientProps = {
  product: ProductDetail;
};

function formatPrice(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

export default function ProductDetailClient({
  product,
}: ProductDetailClientProps) {
  const colorOptions = useMemo(
    () =>
      product.variants.filter(
        (variant, index, variants) =>
          variants.findIndex((item) => item.color.id === variant.color.id) ===
          index,
      ),
    [product.variants],
  );
  const sizeOptions = useMemo(
    () =>
      product.variants.filter(
        (variant, index, variants) =>
          variants.findIndex((item) => item.size.id === variant.size.id) ===
          index,
      ),
    [product.variants],
  );
  const firstAvailableVariant =
    product.variants.find((variant) => variant.stockQuantity > 0) ??
    product.variants[0];
  const [selectedColorId, setSelectedColorId] = useState(
    firstAvailableVariant?.color.id ?? "",
  );
  const [selectedSizeId, setSelectedSizeId] = useState(
    firstAvailableVariant?.size.id ?? "",
  );
  const [selectedImageId, setSelectedImageId] = useState(
    product.images[0]?.id ?? "",
  );
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");
  // Số lượng mỗi biến thể đang có trong giỏ: variantId -> quantity
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>(
    {},
  );

  const loadCartQuantities = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) return; // Chưa đăng nhập: giỏ trống
      const result = await res.json();
      if (!result.success || !Array.isArray(result.data)) return;
      const quantities: Record<string, number> = {};
      for (const item of result.data as {
        variantId: string;
        quantity: number;
      }[]) {
        quantities[item.variantId] =
          (quantities[item.variantId] ?? 0) + item.quantity;
      }
      setCartQuantities(quantities);
    } catch {
      // Không tải được giỏ thì vẫn cho chọn theo tồn kho, server sẽ chặn
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ giỏ hàng từ server
    void loadCartQuantities();
    window.addEventListener("cart-updated", loadCartQuantities);
    return () =>
      window.removeEventListener("cart-updated", loadCartQuantities);
  }, [loadCartQuantities]);

  const selectedVariant = product.variants.find(
    (variant) =>
      variant.color.id === selectedColorId &&
      variant.size.id === selectedSizeId,
  );
  const inCartQuantity = selectedVariant
    ? (cartQuantities[selectedVariant.id] ?? 0)
    : 0;
  // Số lượng tối đa được chọn = tồn kho − số đã có trong giỏ
  const maxQuantity = Math.max(
    0,
    (selectedVariant?.stockQuantity ?? 0) - inCartQuantity,
  );
  const colorImages = product.images.filter(
    (image) => image.colorId === selectedColorId,
  );
  const commonImages = product.images.filter((image) => image.colorId === null);
  const activeImages =
    colorImages.length > 0
      ? colorImages
      : commonImages.length > 0
        ? commonImages
        : product.images;
  const selectedImage =
    activeImages.find((image) => image.id === selectedImageId) ??
    activeImages[0];

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
    const nextColorImage = product.images.find((image) => image.colorId === colorId);
    if (nextColorImage) {
      setSelectedImageId(nextColorImage.id);
    }
    setAddedToCart(false);
    setQuantity(1);
    setError("");
  };

  const handleAddToCart = async () => {
    if (!selectedVariant || maxQuantity < 1) return;

    // Chặn ở giao diện trước khi gọi API
    if (quantity > maxQuantity) {
      setError(
        maxQuantity === 0
          ? `Bạn đã có ${inCartQuantity} sản phẩm này trong giỏ, bằng số lượng còn lại`
          : `Bạn chỉ có thể thêm tối đa ${maxQuantity} sản phẩm (đã có ${inCartQuantity} trong giỏ)`,
      );
      return;
    }

    try {
      setIsAdding(true);
      setError("");
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: selectedVariant.id, quantity }),
      });
      const result = await res.json();

      if (res.ok && result.success) {
        setAddedToCart(true);
        setQuantity(1);
        window.dispatchEvent(new Event("cart-updated"));
      } else if (res.status === 401) {
        setError("Vui lòng đăng nhập để thêm vào giỏ hàng");
      } else {
        // Ví dụ: trong giỏ đã có 3 cái, kho còn 4, khách thêm 2 → server báo lỗi
        setError(result.error?.message ?? "Không thể thêm vào giỏ hàng");
      }
    } catch {
      setError("Lỗi kết nối, vui lòng thử lại");
    } finally {
      setIsAdding(false);
    }
  };

  const displayPrice = product.salePrice ?? product.price;

  return (
    <main className="container mx-auto px-4 py-8">
      <Link href="/products" className="text-sm text-[#17579B] hover:underline">
        ← Quay lại sản phẩm
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-8 md:gap-10 lg:grid-cols-2">
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
                  <img
                    src={image.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section>
          <p className="text-sm uppercase tracking-wide text-gray-500">
            Chi tiết sản phẩm
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#164F8D]">
            {product.name}
          </h1>
          <div className="mt-4 flex items-center gap-3">
            <p className="text-2xl font-bold text-[#164F8D]">
              {formatPrice(displayPrice)}
            </p>
            {product.salePrice !== null ? (
              <p className="text-sm text-gray-400 line-through">
                {formatPrice(product.price)}
              </p>
            ) : null}
          </div>
          <p className="mt-6 leading-7 text-gray-600">
            {product.description ?? "Sản phẩm thời trang unisex của BlueWear."}
          </p>

          <div className="mt-8 border-t pt-6">
            <p className="mb-3 font-semibold text-gray-800">
              Màu:{" "}
              {
                colorOptions.find((item) => item.color.id === selectedColorId)
                  ?.color.name
              }
            </p>
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
            <p className="mb-3 font-semibold text-gray-800">Số lượng</p>
            <div className="inline-flex items-center overflow-hidden rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="px-4 py-2 text-lg font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              >
                −
              </button>
              <span className="min-w-12 px-4 py-2 text-center font-semibold">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                disabled={quantity >= maxQuantity}
                className="px-4 py-2 text-lg font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              >
                +
              </button>
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
                      setQuantity(1);
                      setError("");
                    }}
                    className={`min-w-14 rounded-lg border px-4 py-2 text-sm font-medium ${selectedSizeId === variant.size.id ? "border-[#17579B] bg-[#17579B] text-white" : "border-gray-200 text-gray-700"} ${!available ? "cursor-not-allowed opacity-40 line-through" : "hover:border-[#17579B]"}`}
                  >
                    {variant.size.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-gray-50 px-4 py-3 text-sm" aria-live="polite">
            {selectedVariant && selectedVariant.stockQuantity > 0 ? (
              <span className="font-medium text-green-700">
                ✓ Còn {selectedVariant.stockQuantity} sản phẩm
                {inCartQuantity > 0 ? (
                  <span className="font-normal text-gray-600">
                    {" "}
                    (đã có {inCartQuantity} trong giỏ)
                  </span>
                ) : null}
              </span>
            ) : (
              <span className="font-medium text-red-600">
                Hết hàng với lựa chọn này
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={!selectedVariant || maxQuantity < 1 || isAdding}
            onClick={handleAddToCart}
            className="mt-6 w-full rounded-lg bg-[#17579B] px-6 py-3.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isAdding
              ? "Đang thêm..."
              : addedToCart
                ? "Đã thêm vào giỏ hàng"
                : "Thêm vào giỏ hàng"}
          </button>
          {error ? (
            <p className="mt-3 text-center text-sm text-red-600">{error}</p>
          ) : null}
          {addedToCart ? (
            <Link
              href="/cart"
              className="mt-3 block text-center text-sm font-medium text-[#17579B] hover:underline"
            >
              Xem giỏ hàng
            </Link>
          ) : null}
        </section>
      </div>
    </main>
  );
}
