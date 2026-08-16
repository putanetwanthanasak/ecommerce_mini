import { apiRequest } from "../lib/api";
import type { PageInfo } from "../lib/pagination";

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

export interface OrderListParams {
  page: number;
  limit: number;
}

export interface OrderListResponse {
  orders: Order[];
  pagination: PageInfo;
}

export const orderKeys = {
  detail: (id: string) => ["order", id] as const,
  list: (params: OrderListParams) => ["orders", params] as const,
};

/**
 * The signed-in customer's own orders, newest first.
 *
 * NOTE THE ABSENT `userId` PARAM.
 *
 * GET /api/orders pins a customer's query to the id in their token and only
 * consults `?userId=` on the admin branch (see backend/src/routes/orders.ts).
 * Sending one from here would achieve nothing for a customer — it is ignored,
 * not honoured — but it would put a "whose orders?" knob in the client and
 * imply the answer is the frontend's to give. It isn't. Ownership is decided by
 * the token, server-side, and this request deliberately has no way to express
 * an opinion about it.
 *
 * The backend already orders by createdAt descending, so there is no sort
 * parameter either.
 */
export function fetchOrders(params: OrderListParams): Promise<OrderListResponse> {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  return apiRequest<OrderListResponse>(`/api/orders?${query.toString()}`);
}

export function createOrder(input: CreateOrderInput): Promise<Order> {
  return apiRequest<{ order: Order }>("/api/orders", {
    method: "POST",
    body: input,
  }).then((res) => res.order);
}

export function fetchOrder(id: string): Promise<Order> {
  return apiRequest<{ order: Order }>(`/api/orders/${id}`).then((res) => res.order);
}
