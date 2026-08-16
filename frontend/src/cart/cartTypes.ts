import type { Product } from "../catalog/catalogApi";

/**
 * One line of the cart, as it is held in memory and in localStorage.
 *
 * THE SNAPSHOT FIELDS ARE FOR DISPLAY ONLY.
 *
 * `name`, `price` and `stock` are copied off the product at the moment it was
 * added so the cart page can render without a request per line. They are not
 * evidence of anything:
 *
 *   - `price` is never sent to the backend. POST /api/orders takes
 *     { productId, quantity } and nothing else; the price of every line is read
 *     off the product row inside the order transaction, precisely so a client
 *     cannot name its own price. If this snapshot disagrees with the real price,
 *     the real price wins and the customer is charged that one. It exists to put
 *     a number on the screen before checkout, not to determine what is owed.
 *
 *   - `stock` was true when the item was added and may be days old. It caps the
 *     quantity stepper so the obvious mistakes are caught early, but the cart
 *     page re-fetches every product on mount and the backend's `stock >= qty`
 *     guard is the only thing that actually decides. See CLAUDE.md: a check is
 *     not a lock.
 */
export interface CartItem {
  productId: string;
  quantity: number;
  /** Display-only snapshot — see above. */
  name: string;
  /** Display-only snapshot — the backend recomputes the real price at order time. */
  price: string;
  /** Display-only snapshot — stock as it was when this item was added. */
  stock: number;
}

/** Builds a cart line from a catalog product. */
export function toCartItem(product: Product, quantity: number): CartItem {
  return {
    productId: product.id,
    quantity,
    name: product.name,
    price: product.price,
    stock: product.stock,
  };
}

/** Total units across every line — what the header badge counts. */
export function countCartItems(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}
