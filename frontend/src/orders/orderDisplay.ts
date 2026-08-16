import type { Order } from "./ordersApi";

/**
 * A uuid shortened to something a person can hold in their head.
 *
 * The first 8 hex characters, kept lowercase so it is visibly a prefix of the
 * full id shown on the detail page — uppercasing it would look like a different
 * reference number and send someone hunting for a code that doesn't exist.
 *
 * Display only. Every lookup uses the full id.
 */
export function shortOrderId(id: string): string {
  return id.slice(0, 8);
}

/**
 * Units in an order, not lines.
 *
 * "3 items" for a single line of quantity 3 is what a customer means by it, and
 * it matches how the cart badge counts. Counting lines instead would make an
 * order of three identical things read as "1 item".
 */
export function countOrderItems(order: Order): number {
  return order.items.reduce((total, item) => total + item.quantity, 0);
}
