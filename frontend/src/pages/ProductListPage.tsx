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
import { ProductCard, ProductCardSkeleton } from "../catalog/ProductCard";
import { useCatalogParams, DEFAULT_PAGE_SIZE } from "../catalog/useCatalogParams";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

// Long enough that a typed word is one request, short enough that the list
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
    // the list empties on every page change and the whole layout jumps.
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
   * Three different situations render zero rows, and they need different
   * words. Collapsing them into one "No products found" would tell a user with
   * an empty catalog to adjust filters they never set, and leave a user
   * stranded past the last page with no idea why the list went blank.
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
      return <ListSkeleton count={Math.min(params.limit, DEFAULT_PAGE_SIZE)} />;
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
      <div className="space-y-8">
        {/*
          A card grid — image first. The columns step 1 → 2 → 4 with the
          viewport; the image carries the recognition the old list leaned on a
          column rail to supply.
        */}
        <ul
          aria-busy={isRefreshing}
          className={`grid grid-cols-1 gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-4 ${
            isRefreshing ? "opacity-60" : "opacity-100"
          }`}
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </ul>

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
        A card grid puts an image on the page, so the heading no longer has to
        stay out of the way of the prices — it reads at title scale, with the
        catalog's own line under it.
      */}
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <h1 className="condensed text-title font-bold tracking-tight text-ink">Products</h1>
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
        <p className="mt-2 text-body text-ink-subtle">
          A small, careful catalog for people who build things.
        </p>
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

function ListSkeleton({ count }: { count: number }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading products</span>
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: count }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </ul>
    </div>
  );
}
