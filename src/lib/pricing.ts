type Money = number | string | { toString(): string };

export type PricedProduct = {
  price: Money;
  salePrice: Money | null;
  saleStartsAt?: Date | string | null;
  saleEndsAt?: Date | string | null;
};

/**
 * Giá khuyến mãi đang có hiệu lực, hoặc null nếu không có / chưa tới / đã hết hạn.
 * Không đặt ngày bắt đầu hoặc kết thúc thì xem như không giới hạn phía đó.
 */
export function getActiveSalePrice(
  product: PricedProduct,
  now: Date = new Date(),
): number | null {
  if (product.salePrice === null) return null;
  if (product.saleStartsAt && new Date(product.saleStartsAt) > now) return null;
  if (product.saleEndsAt && new Date(product.saleEndsAt) < now) return null;
  return Number(product.salePrice);
}

/** Giá thực tế khách phải trả cho một sản phẩm tại thời điểm `now`. */
export function getEffectivePrice(
  product: PricedProduct,
  now: Date = new Date(),
): number {
  return getActiveSalePrice(product, now) ?? Number(product.price);
}
