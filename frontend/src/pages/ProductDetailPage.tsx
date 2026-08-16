import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { EmptyState } from "../components/EmptyState";
import { ErrorBanner } from "../components/ErrorBanner";
import { AddToCartButton } from "../cart/AddToCartButton";
import { catalogKeys, fetchProduct } from "../catalog/catalogApi";
import { StockBadge } from "../catalog/StockBadge";
import { ApiError } from "../lib/api";
import { formatPrice } from "../lib/money";

const ACTION_BUTTON =
  "inline-block rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-300";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();

  const query = useQuery({
    queryKey: catalogKeys.product(id ?? ""),
    queryFn: () => fetchProduct(id as string),
    // The route can't match without an :id, but the type is string | undefined
    // and firing a request for /api/products/undefined would be a confusing 404.
    enabled: Boolean(id),
  });

  function renderProduct() {
    if (query.isPending) return <ProductDetailSkeleton />;

    if (query.isError) {
      // A 404 here is an ordinary outcome — a deleted product, or a stale
      // shared link — not a system failure, so it gets an empty state instead
      // of a red banner. Everything else is a real error and keeps the banner.
      if (query.error instanceof ApiError && query.error.status === 404) {
        return (
          <EmptyState
            title="Product not found"
            message="This product may have been removed since the link was created."
            action={
              <Link to="/products" className={ACTION_BUTTON}>
                Browse the catalog
              </Link>
            }
          />
        );
      }

      return (
        <ErrorBanner
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      );
    }

    const product = query.data;

    return (
      <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <Link
          to={`/products?categoryId=${product.categoryId}`}
          className="text-xs font-medium tracking-wide text-slate-400 uppercase transition hover:text-slate-600"
        >
          {product.category.name}
        </Link>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{product.name}</h1>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-3xl font-semibold text-slate-900">
            {formatPrice(product.price)}
          </span>
          <StockBadge stock={product.stock} />
        </div>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <h2 className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            Description
          </h2>
          {product.description ? (
            // whitespace-pre-line keeps any line breaks an admin typed in.
            <p className="mt-2 text-sm whitespace-pre-line text-slate-700">{product.description}</p>
          ) : (
            <p className="mt-2 text-sm text-slate-400 italic">No description provided.</p>
          )}
        </div>

        <dl className="mt-6 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2">
          <div className="bg-white p-5">
            <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Units in stock
            </dt>
            <dd className="mt-1.5 text-sm font-medium text-slate-900">{product.stock}</dd>
          </div>
          <div className="bg-white p-5">
            <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Product ID
            </dt>
            <dd className="mt-1.5 font-mono text-xs break-all text-slate-600">{product.id}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-slate-200 pt-6">
          {/* Same control as the grid card, so a click means the same thing on
              both screens: one more unit. Quantity is edited in the cart. */}
          <AddToCartButton product={product} />
          <Link to="/cart" className="text-sm text-slate-600 underline-offset-4 hover:underline">
            View cart
          </Link>
        </div>
      </article>
    );
  }

  return (
    <AppLayout>
      {/* Always rendered, at a fixed position, so every state below — loading,
          404, loaded — has the same way back to the catalog. Plain Link rather
          than history.back(): arriving from a shared URL has nothing to go back
          to, and the filters live in the catalog URL anyway. */}
      <Link to="/products" className="text-sm text-slate-500 hover:text-slate-900">
        ← Back to products
      </Link>

      <div className="mt-6">{renderProduct()}</div>
    </AppLayout>
  );
}

function ProductDetailSkeleton() {
  return (
    <div
      className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 sm:p-8"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading product</span>
      <div className="h-3 w-24 rounded bg-slate-100" />
      <div className="mt-3 h-7 w-2/3 rounded bg-slate-100" />
      <div className="mt-5 h-9 w-32 rounded bg-slate-100" />
      <div className="mt-6 border-t border-slate-200 pt-6">
        <div className="h-4 w-full rounded bg-slate-100" />
        <div className="mt-2 h-4 w-4/5 rounded bg-slate-100" />
      </div>
      <div className="mt-6 h-24 rounded-xl bg-slate-100" />
    </div>
  );
}
