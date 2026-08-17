import { useEffect, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { ErrorBanner } from "../components/ErrorBanner";
import { FormField } from "../components/FormField";
import { catalogKeys, fetchProducts } from "../catalog/catalogApi";
import { CategoryFilter } from "../catalog/CategoryFilter";
import { Pagination } from "../components/Pagination";
import { ProductRow, ProductRowSkeleton } from "../catalog/ProductRow";
import { useCatalogParams, DEFAULT_PAGE_SIZE } from "../catalog/useCatalogParams";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

// Long enough that a typed word is one request, short enough that the grid
// doesn't feel stuck after the user stops.
const SEARCH_DEBOUNCE_MS = 350;

export function ProductListPage() {
  const { params, hasFilters, setSearch, setCategoryId, setPage, clearFilters } = useCatalogParams();

  // The box updates on every keystroke; only the debounced value reaches the URL.
  const [searchInput, setSearchInput] = useState(params.search);
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);

  /*
   * Two effects push in opposite directions — typing writes the URL, and the
   * URL writes the box — so they need something to stop them chasing each
   * other. This ref holds the last value the two agreed on: each effect bails
   * when it sees its own write coming back, and only acts on a change that
   * genuinely came from the other side (the back button, or "Clear filters"
   * emptying the search).
   */
  const syncedSearch = useRef(params.search);

  useEffect(() => {
    if (debouncedSearch === syncedSearch.current) return;
    syncedSearch.current = debouncedSearch;
    setSearch(debouncedSearch);
  }, [debouncedSearch, setSearch]);

  useEffect(() => {
    if (params.search === syncedSearch.current) return;
    syncedSearch.current = params.search;
    setSearchInput(params.search);
  }, [params.search]);

  const query = useQuery({
    queryKey: catalogKeys.products(params),
    queryFn: () => fetchProducts(params),
    // Hold the previous page's results while the next one loads. Without this
    // the grid empties on every page change and the whole layout jumps.
    placeholderData: keepPreviousData,
  });

  const products = query.data?.products ?? [];
  const pagination = query.data?.pagination;
  // isPending is the very first load (nothing to show yet); isFetching with
  // data already present is a background refresh, which only dims the grid.
  const isRefreshing = query.isFetching && !query.isPending;

  function handleClearFilters() {
    // Clear the box directly as well as the URL: the debounce would otherwise
    // leave the old text sitting in the input for another 350ms.
    setSearchInput("");
    syncedSearch.current = "";
    clearFilters();
  }

  /*
   * Three different situations render zero cards, and they need different
   * words. Collapsing them into one "No products found" would tell a user with
   * an empty catalog to adjust filters they never set, and leave a user
   * stranded past the last page with no idea why the grid went blank.
   */
  function renderEmpty() {
    if (pagination && pagination.total > 0) {
      return (
        <EmptyState
          title={`Page ${pagination.page} is past the end`}
          message={`${pagination.total} matching ${
            pagination.total === 1 ? "product" : "products"
          } across ${pagination.totalPages} ${pagination.totalPages === 1 ? "page" : "pages"}.`}
          action={
            <Button onClick={() => setPage(1)}>Back to page 1</Button>
          }
        />
      );
    }

    if (hasFilters) {
      return (
        <EmptyState
          title="No products match your filters"
          message={
            params.search
              ? `Nothing here matches "${params.search}". Try a shorter search, or a different category.`
              : "This category has no products yet."
          }
          action={
            <Button onClick={handleClearFilters}>Clear filters</Button>
          }
        />
      );
    }

    return (
      <EmptyState
        title="The catalog is empty"
        message="No products have been added yet. Check back once an admin has stocked the store."
      />
    );
  }

  function renderResults() {
    if (query.isPending) {
      return <BoardSkeleton count={Math.min(params.limit, DEFAULT_PAGE_SIZE)} />;
    }

    if (query.isError) {
      return (
        <ErrorBanner
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      );
    }

    if (products.length === 0) return renderEmpty();

    return (
      <div className="space-y-6">
        {/*
          The board: one flap per product, separated by the chassis hairline. The
          column rail above it names what each column holds, which is what makes a
          board readable without a single picture — and it only works because
          every price now lands in one column.
        */}
        <div>
          <ColumnRail />
          <ul
            aria-busy={isRefreshing}
            className={`surface divide-y divide-hairline transition-opacity ${
              isRefreshing ? "opacity-60" : "opacity-100"
            }`}
          >
            {products.map((product) => (
              <ProductRow key={product.id} product={product} />
            ))}
          </ul>
        </div>

        {pagination && (
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
            busy={isRefreshing}
            label="Product pages"
          />
        )}
      </div>
    );
  }

  return (
    <AppLayout>
      {/*
        The heading is set as a rail, not a display line. It used to be the largest
        text on the page — a shopping surface whose loudest word was "Products",
        which is the name of a database table. The figures on the board are the
        largest type here now, because they are what the visitor came to read.
      */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h1 className="condensed text-row font-bold tracking-[0.14em] text-ink uppercase">
          Products
        </h1>
        {pagination && (
          <p className="text-meta text-ink-subtle">
            {/*
              NO BARE NUMBERS: a count says what it counts. This read "12 products
              matching" — a sentence that stopped mid-thought and never named what
              they matched.
            */}
            <span className="figures text-ink-muted">{pagination.total}</span>{" "}
            {pagination.total === 1 ? "product" : "products"}
            {hasFilters && params.search && ` matching “${params.search}”`}
            {hasFilters && !params.search && " in this category"}
          </p>
        )}
      </div>

      {/* Filters stay mounted through the loading and error states — losing the
          controls is what turns a failed fetch into a dead end. */}
      <div className="mt-6 space-y-4">
        <div className="max-w-sm">
          <FormField
            label="Search"
            name="search"
            type="search"
            placeholder="Search products by name"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            autoComplete="off"
          />
        </div>

        <CategoryFilter selectedId={params.categoryId} onSelect={setCategoryId} />

        {hasFilters && <Button onClick={handleClearFilters}>Clear filters</Button>}
      </div>

      <div className="mt-8">{renderResults()}</div>
    </AppLayout>
  );
}

/**
 * The board's column rail.
 *
 * Hidden below `sm`, where the rows collapse to a stack and column headers would
 * be labelling columns that no longer exist. `aria-hidden` because these are
 * visual column labels for a list, not a data table — the rows carry their own
 * accessible text, and announcing "ITEM STOCK PRICE" before the list would be
 * noise to a screen reader.
 */
function ColumnRail() {
  return (
    <div
      aria-hidden="true"
      className="hidden grid-cols-[minmax(0,1fr)_7rem_7rem_10rem] items-center gap-x-4 px-5 pb-2 sm:grid"
    >
      <span className="rail">Item</span>
      <span className="rail">Stock</span>
      <span className="rail text-right">Price</span>
      {/* Spacer matching the add control's column so the labels stay over their columns. */}
      <span aria-hidden="true" />
    </div>
  );
}

function BoardSkeleton({ count }: { count: number }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading products</span>
      <ColumnRail />
      <ul className="surface divide-y divide-hairline">
        {Array.from({ length: count }, (_, i) => (
          <ProductRowSkeleton key={i} />
        ))}
      </ul>
    </div>
  );
}
