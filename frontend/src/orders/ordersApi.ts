import { apiRequest } from "../lib/api";

export type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "CANCELLED";

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  /**
   * What this line actually cost, per unit, at the moment the order was placed.
   * A string for the same reason product.price is — see lib/money.ts.
   *
   * This is NOT product.price. The backend copies it onto the row inside the
   * order transaction so an order stays a record of what was paid even after
   * the product is repriced. Rendering an order must always read this field.
   */
  priceAtPurchase: string;
  /** The product as it is *now* — its `price` may already differ from priceAtPurchase. */
  product: { id: string; name: string; price: string };
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  /** Sum of every line's priceAtPurchase × quantity, computed by the backend. */
  totalPrice: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

/**
 * The entire checkout payload.
 *
 * Two fields per line, and there is no third. The backend's Zod schema has no
 * `price` and no `totalPrice`, and adding one here would be the start of a bug
 * where the client decides what it owes.
 */
export interface CreateOrderInput {
  items: Array<{ productId: string; quantity: number }>;
}

export const orderKeys = {
  detail: (id: string) => ["order", id] as const,
};

export function createOrder(input: CreateOrderInput): Promise<Order> {
  return apiRequest<{ order: Order }>("/api/orders", {
    method: "POST",
    body: input,
  }).then((res) => res.order);
}

export function fetchOrder(id: string): Promise<Order> {
  return apiRequest<{ order: Order }>(`/api/orders/${id}`).then((res) => res.order);
}
