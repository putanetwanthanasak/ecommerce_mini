import type { CartItem } from "../cart/cartTypes";
import { ApiError } from "../lib/api";

/**
 * A failed checkout, classified into the thing the user has to do next.
 *
 * Checkout is the one screen where the backend's business rules are visible,
 * and each of them wants a different response. "Insufficient stock for Blue
 * Mug" needs the quantity reduced; "Product <id> not found" needs that line
 * removed; a validation failure needs the field messages. Rendering the raw
 * `error` string for all three leaves the user re-clicking a button that will
 * keep failing for a reason they can't see.
 */
export type CheckoutProblem =
  | {
      kind: "stock";
      /** Resolved from the cart by name — null if the message named something we don't hold. */
      productId: string | null;
      productName: string;
      message: string;
    }
  | {
      kind: "missing";
      /** The backend puts the id in the message, so this is reliable when present. */
      productId: string | null;
      message: string;
    }
  | { kind: "validation"; messages: string[] }
  | { kind: "session"; message: string }
  | { kind: "other"; message: string };

// `Insufficient stock for ${product.name}` — see backend/src/routes/orders.ts.
const STOCK_PREFIX = "Insufficient stock for ";
// `Product ${item.productId} not found`
const MISSING_PATTERN = /^Product ([0-9a-f-]{36}) not found$/i;
// Zod paths arrive joined with dots: `items.0.quantity`.
const ITEM_PATH_PATTERN = /^items\.(\d+)(?:\.(.+))?$/;

export function toCheckoutProblem(error: unknown, items: CartItem[]): CheckoutProblem {
  if (!(error instanceof ApiError)) {
    return { kind: "other", message: error instanceof Error ? error.message : "Something went wrong." };
  }

  if (error.status === 409 && error.message.startsWith(STOCK_PREFIX)) {
    /*
     * The 409 names the product but carries no id — the message is built from
     * `product.name` inside the transaction. Matching it back to a cart line by
     * name is the only handle available, and it is imperfect: two products can
     * share a name. It is used only to point the UI at a row to offer a fix on,
     * so the failure mode of a wrong match is a suggestion next to the wrong
     * line, never a silent edit. `productId: null` degrades to the message plus
     * a link back to the cart, which is still actionable.
     */
    const productName = error.message.slice(STOCK_PREFIX.length);
    const match = items.find((item) => item.name === productName);
    return {
      kind: "stock",
      productId: match?.productId ?? null,
      productName,
      message: error.message,
    };
  }

  if (error.status === 404) {
    const match = MISSING_PATTERN.exec(error.message);
    return { kind: "missing", productId: match?.[1] ?? null, message: error.message };
  }

  if (error.status === 400) {
    return { kind: "validation", messages: describeValidation(error, items) };
  }

  // 401 already cleared the session inside apiRequest; ProtectedRoute is
  // redirecting to /login as this renders. Naming it separately lets checkout
  // reassure the user their cart is still here rather than flashing a red box.
  if (error.status === 401) {
    return { kind: "session", message: error.message };
  }

  return { kind: "other", message: error.message };
}

/**
 * Turns `details[]` into sentences a person can act on.
 *
 * The bare "Validation failed" is useless, and so is a raw `items.0.quantity`
 * — the user never saw an index. Resolving the index back to the product name
 * they're looking at is the difference between a fixable message and a puzzle.
 */
function describeValidation(error: ApiError, items: CartItem[]): string[] {
  if (error.details.length === 0) return [error.message];

  return error.details.map((detail) => {
    const match = ITEM_PATH_PATTERN.exec(detail.path);
    if (!match) return detail.path ? `${detail.path}: ${detail.message}` : detail.message;

    const item = items[Number(match[1])];
    const label = item ? item.name : `Item ${Number(match[1]) + 1}`;
    return `${label}: ${detail.message}`;
  });
}
