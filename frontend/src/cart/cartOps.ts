import type { Product } from "../catalog/catalogApi";
import { toCartItem, type CartItem } from "./cartTypes";

/*
 * Every cart mutation, as pure functions over the item list.
 *
 * They live outside CartProvider so the rules — increment instead of
 * duplicate, zero means remove, never exceed known stock — are readable and
 * exercisable on their own, rather than being tangled up in a state setter.
 * The provider is then just storage plus wiring.
 */

/**
 * Adds units of a product.
 *
 * A product already in the cart has its line incremented rather than a second
 * line pushed. Two lines for one product would each look independently editable
 * while the backend sees a single claim on the same stock, and the total would
 * be right while every line read wrong.
 */
export function addToCart(items: CartItem[], product: Product, quantity: number): CartItem[] {
  if (quantity <= 0) return items;
  // Nothing to reserve. The add buttons are disabled at zero stock, so this is
  // a guard against a stale render, not a path users normally hit.
  if (product.stock <= 0) return items;

  const existing = items.find((item) => item.productId === product.id);
  if (!existing) {
    return [...items, toCartItem(product, Math.min(quantity, product.stock))];
  }

  // The snapshot fields are refreshed from `product` at the same time: it came
  // from a catalog response that is seconds old, which is strictly better than
  // whatever was captured when the item was first added.
  return items.map((item) =>
    item.productId === product.id
      ? toCartItem(product, Math.min(item.quantity + quantity, product.stock))
      : item
  );
}

/**
 * Sets an absolute quantity on one line.
 *
 * Editing down to nothing is a removal: keeping a zero-quantity line would send
 * `quantity: 0` to a backend that requires a positive integer, turning "take it
 * out" into a 400.
 */
export function setCartQuantity(
  items: CartItem[],
  productId: string,
  quantity: number
): CartItem[] {
  if (quantity <= 0) return removeFromCart(items, productId);

  return items.map((item) =>
    item.productId === productId ? { ...item, quantity: Math.floor(quantity) } : item
  );
}

export function removeFromCart(items: CartItem[], productId: string): CartItem[] {
  return items.filter((item) => item.productId !== productId);
}
