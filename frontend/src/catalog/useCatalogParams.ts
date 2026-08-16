import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { readPositiveInt } from "../lib/pagination";
import type { ProductListParams } from "./catalogApi";

export const DEFAULT_PAGE_SIZE = 12;

// The backend clamps ?limit= to 100 rather than rejecting it. Clamping here too
// keeps the number we display ("Page 2 of 5") honest about what was requested.
const MAX_PAGE_SIZE = 100;

export interface CatalogParamsApi {
  /** Exactly what gets sent to GET /api/products. */
  params: ProductListParams;
  /** True when a search or category is narrowing the list. */
  hasFilters: boolean;
  setSearch: (search: string) => void;
  setCategoryId: (categoryId: string) => void;
  setPage: (page: number) => void;
  clearFilters: () => void;
}

/**
 * Reads the catalog's page/search/category out of the URL and writes changes
 * back to it.
 *
 * The query string is the single source of truth, not component state. That is
 * what makes a filtered view shareable, survive a refresh, and respond to the
 * back button — with local state, the URL and the grid drift apart the moment
 * the user navigates.
 */
export function useCatalogParams(): CatalogParamsApi {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo<ProductListParams>(
    () => ({
      // A hand-edited ?page=0 or ?page=abc falls back to 1 instead of being
      // forwarded to the backend as a guaranteed 400.
      page: readPositiveInt(searchParams.get("page"), 1, Number.MAX_SAFE_INTEGER),
      limit: readPositiveInt(searchParams.get("limit"), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
      search: searchParams.get("search")?.trim() ?? "",
      categoryId: searchParams.get("categoryId") ?? "",
    }),
    [searchParams]
  );

  const update = useCallback(
    (patch: Record<string, string | number>, replace = false) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(patch)) {
            // Empty means "back to the default", and defaults are left out of
            // the URL entirely — so clearing a filter gives you /products, not
            // /products?search=&categoryId=&page=1.
            if (value === "" || value === 0) next.delete(key);
            else next.set(key, String(value));
          }
          return next;
        },
        { replace }
      );
    },
    [setSearchParams]
  );

  // Every filter change resets to page 1. Without this, narrowing a 5-page
  // result set while on page 4 lands the user on an empty page that looks like
  // "no results" but isn't.
  const setSearch = useCallback(
    (search: string) => {
      // `replace` because this is driven by the debounced search box: pushing a
      // history entry per pause in typing would make Back a per-word undo. The
      // URL still updates, so the view stays shareable and refresh-safe.
      update({ search, page: 0 }, true);
    },
    [update]
  );

  const setCategoryId = useCallback(
    (categoryId: string) => update({ categoryId, page: 0 }),
    [update]
  );

  const setPage = useCallback((page: number) => update({ page: page <= 1 ? 0 : page }), [update]);

  const clearFilters = useCallback(() => update({ search: "", categoryId: "", page: 0 }), [update]);

  return {
    params,
    hasFilters: params.search !== "" || params.categoryId !== "",
    setSearch,
    setCategoryId,
    setPage,
    clearFilters,
  };
}
