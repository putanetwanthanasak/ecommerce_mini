import { useQueries } from "@tanstack/react-query";
import { catalogKeys, fetchProduct } from "../catalog/catalogApi";
import { ApiError } from "../lib/api";
import type { CartItem } from "./cartTypes";

/**
 * What the re-fetch says about one line.
 *
 *   loading — no answer yet; the snapshot is on screen meanwhile
 *   ok      — the product exists and has enough stock for the quantity in the cart
 *   short   — it exists, but stock has dropped below the cart quantity
 *   gone    — 404: deleted since it was added
 *   error   — the request itself failed; we know nothing, so we claim nothing
 */
export type CartLineStatus = "loading" | "ok" | "short" | "gone" | "error";

export interface CartLine {
  item: CartItem;
  status: CartLineStatus;
  /** Live stock, or null until the re-fetch answers. */
  stock: number | null;
  /**
   * Upper bound for the quantity stepper: live stock when we have it, the
   * snapshot otherwise. Advisory either way — the backend decides.
   */
  cap: number;
  /** Live name and price when loaded, falling back to the snapshot. */
  name: string;
  price: string;
  error: unknown;
}

export interface CartLines {
  lines: CartLine[];
  /** True while any line is still being checked. */
  isLoading: boolean;
  /** At least one line is a 404 — checkout is blocked until it's removed. */
  hasUnavailable: boolean;
}

/**
 * Re-checks every product in the cart against the catalog.
 *
 * A cart can sit in localStorage for days. Its snapshot of price and stock was
 * true once and is not evidence of anything now, so the cart page asks the
 * server again on every mount rather than rendering week-old numbers as if they
 * were current.
 *
 * What it deliberately does NOT do is edit the cart. If stock fell to 1 under a
 * quantity of 3, the line still says 3 and the row says so out loud — silently
 * rewriting it would change the user's order behind their back and, worse, make
 * it look like they chose the smaller number. Every fix is offered as a button.
 */
export function useCartLines(items: CartItem[]): CartLines {
  const results = useQueries({
    queries: items.map((item) => ({
      queryKey: catalogKeys.product(item.productId),
      queryFn: () => fetchProduct(item.productId),
      // The whole point of this hook is freshness: a cached copy from the
      // detail page an hour ago is exactly what we're trying not to trust.
      staleTime: 0,
      refetchOnMount: "always" as const,
    })),
  });

  const lines: CartLine[] = items.map((item, index) => {
    const result = results[index];
    const product = result?.data;

    if (product) {
      return {
        item,
        status: product.stock < item.quantity ? "short" : "ok",
        stock: product.stock,
        cap: product.stock,
        name: product.name,
        price: product.price,
        error: null,
      };
    }

    if (result?.isError) {
      // A 404 is a real answer — the product is gone. Any other failure means
      // the request broke, which tells us nothing about the product, so the
      // line falls back to its snapshot instead of being condemned.
      const gone = result.error instanceof ApiError && result.error.status === 404;
      return {
        item,
        status: gone ? "gone" : "error",
        stock: null,
        cap: gone ? 0 : item.stock,
        name: item.name,
        price: item.price,
        error: result.error,
      };
    }

    return {
      item,
      status: "loading",
      stock: null,
      cap: item.stock,
      name: item.name,
      price: item.price,
      error: null,
    };
  });

  return {
    lines,
    isLoading: results.some((result) => result.isPending),
    hasUnavailable: lines.some((line) => line.status === "gone"),
  };
}
