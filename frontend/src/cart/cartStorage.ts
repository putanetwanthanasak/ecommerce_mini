import type { CartItem } from "./cartTypes";

const CART_KEY = "ecommerce.cart";

/*
 * The cart is persisted next to the token, and deliberately NOT cleared when
 * the session ends.
 *
 * That is what makes a token expiring mid-checkout survivable: apiRequest sees
 * the 401, AuthProvider drops the session, ProtectedRoute sends the user to
 * /login, and after signing back in their cart is still there. Clearing the
 * cart on logout would make an expired token silently destroy the thing the
 * user was in the middle of buying.
 *
 * The cost is that a shared browser hands the next person the previous
 * person's cart. That is acceptable here because the cart holds no private
 * data — product ids, names and public catalog prices — and every actual order
 * is placed against the token of whoever is signed in at the time. If the cart
 * ever grows something personal (an address, a saved card), it needs to be
 * namespaced per user or dropped on logout, and this comment is wrong.
 */
export function loadCart(): CartItem[] {
  let raw: string | null;
  try {
    raw = localStorage.getItem(CART_KEY);
  } catch {
    // Private-mode Safari and hardened settings can throw on access.
    return [];
  }
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartItem);
  } catch {
    // Hand-edited or written by an older build with a different shape. An
    // unreadable cart starts empty rather than crashing every page that reads
    // it — this value comes from a place the user can edit.
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // Quota exceeded, or storage blocked. Non-fatal: the in-memory cart still
    // works for this tab, it just won't survive a refresh.
  }
}

/**
 * Validates one stored line.
 *
 * Anything that fails is dropped instead of being repaired. A line whose shape
 * we don't recognise has an unknown quantity, and guessing one would be a
 * silent edit to an order the user is about to place.
 */
function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;

  return (
    typeof item.productId === "string" &&
    item.productId !== "" &&
    typeof item.quantity === "number" &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0 &&
    typeof item.name === "string" &&
    typeof item.price === "string" &&
    typeof item.stock === "number"
  );
}
