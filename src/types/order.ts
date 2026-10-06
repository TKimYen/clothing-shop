export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPING"
  | "DELIVERED"
  | "CANCELLED";

export type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  sizeLabel: string;
  colorName: string;
  unitPrice: number;
  qty: number;
};

export type Order = {
  id: string;
  orderCode: string;
  createdAt: string;
  status: OrderStatus;
  userId: string;
  /** Snapshot taken at checkout. Never linked to the user's current Address. */
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  note: string;
  /** Snapshot, nullable. */
  couponCode: string | null;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  payment: {
    method: string;
    status: string;
    transactionId: string;
    paidAt: string | null;
  };
};

export type OrderStatusUpdate = {
  status: OrderStatus;
};

export const ORDER_STATUS_FLOW: readonly OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPING",
  "DELIVERED",
] as const;

export const ORDER_STATUSES: readonly OrderStatus[] = [
  ...ORDER_STATUS_FLOW,
  "CANCELLED",
] as const;
