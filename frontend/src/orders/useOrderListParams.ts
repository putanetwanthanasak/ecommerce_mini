import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { readPositiveInt } from "../lib/pagination";
import type { OrderListParams } from "./ordersApi";

export const DEFAULT_ORDER_PAGE_SIZE = 10;

// The backend clamps ?limit= to 100 rather than rejecting it. Clamping here too
// keeps the number we display ("Page 2 of 5") honest about what was requested.
const MAX_PAGE_SIZE = 100;

export interface OrderListParamsApi {
  /** Exactly what gets sent to GET /api/orders. */
  params: OrderListParams;
  setPage: (page: number) => void;
}

/**
 * Reads the order history's page out of the URL and writes changes back.
 *
 * Same rule as the catalog (frontend invariant 12): the query string is the
 * source of truth, not component state, so a page is shareable, survives a
 * refresh and responds to the back button. It is a smaller hook only because
 * the history has nothing to filter by yet — a status filter would belong here,
 * not in a useState inside the page.
 */
export function useOrderListParams(): OrderListParamsApi {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo<OrderListParams>(
    () => ({
      // A hand-edited ?page=0 or ?page=abc falls back to 1 instead of being
      // forwarded to the backend as a guaranteed 400.
      page: readPositiveInt(searchParams.get("page"), 1, Number.MAX_SAFE_INTEGER),
      limit: readPositiveInt(searchParams.get("limit"), DEFAULT_ORDER_PAGE_SIZE, MAX_PAGE_SIZE),
    }),
    [searchParams]
  );

  const setPage = useCallback(
    (page: number) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        // Page 1 is the default and is left out of the URL entirely, so paging
        // back to the start gives you /orders, not /orders?page=1.
        if (page <= 1) next.delete("page");
        else next.set("page", String(page));
        return next;
      });
    },
    [setSearchParams]
  );

  return { params, setPage };
}
