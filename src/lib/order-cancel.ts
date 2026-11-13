import type { OrderStatus, Prisma } from "@/src/generated/prisma/client";
 
/**
 * Hủy đơn và cộng lại tồn kho, nhiều nhất MỘT lần.
 * Trả về true nếu chính lời gọi này đã hủy đơn,
 * false nếu đơn không còn ở một trong các trạng thái fromStatuses.
 */
export async function cancelOrderAndRestock(
  tx: Prisma.TransactionClient,
  orderId: string,
  fromStatuses: OrderStatus[],
): Promise<boolean> {
  // TODO 1: gọi tx.order.updateMany với
  //         where: { id: orderId, status: { in: fromStatuses } }
  //         data:  { status: "CANCELLED" }
  //         và lưu kết quả vào biến cancelled
 
  // TODO 2: nếu cancelled.count === 0 thì return false
 
  // TODO 3: đọc các dòng tx.orderItem của đơn (variantId, quantity),
  //         với mỗi dòng: tx.productVariant.update tăng stockQuantity thêm quantity
 
  return false;
}
