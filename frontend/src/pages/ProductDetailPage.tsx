import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { buttonClass } from "../components/buttonStyles";
import { EmptyState } from "../components/EmptyState";
import { ArrowLeftIcon } from "../components/icons";
import { ErrorBanner } from "../components/ErrorBanner";
import { AddToCartButton } from "../cart/AddToCartButton";
import { catalogKeys, fetchProduct } from "../catalog/catalogApi";
import { StockCell } from "../catalog/StockCell";
import { ApiError } from "../lib/api";
import { formatPrice } from "../lib/money";

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
              <Link to="/products" className={buttonClass()}>
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
      <article className="surface p-6 sm:p-8">
        {/*
          The name leads. The category used to sit above it as an eyebrow — a label
          doing the heading's job — and now follows it as what it is: a link back
          into a filtered board.
        */}
        <h1 className="condensed text-title font-bold tracking-tight text-ink">{product.name}</h1>

        <Link
          to={`/products?categoryId=${product.categoryId}`}
          className="focus-ring rail mt-2 inline-block rounded-control transition hover:text-amber"
        >
          {product.category.name}
        </Link>

        {/*
          The two facts, at the scale they deserve, each saying what guarantees it.
          A bare "$38.00" asks to be trusted; "$38.00 / confirmed by the server when
          you order" earns it — and both claims are true here, because the order
          transaction reads the price off its own row and folds the stock check into
          the write.
        */}
        <div className="mt-8 flex flex-wrap items-end gap-x-10 gap-y-6 border-t border-hairline pt-8">
          <div>
            <p className="figures text-display text-ink">{formatPrice(product.price)}</p>
            <p className="rail mt-2">Confirmed by the server when you order</p>
          </div>

          <div>
            <StockCell stock={product.stock} />
            <p className="rail mt-2">
              {product.stock > 0
                ? "Reserved the moment your order is placed"
                : "Nothing left to reserve"}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          {/* Same control as the board row, so a click means the same thing on
              both screens: one more unit. Quantity is edited in the cart. */}
          <AddToCartButton product={product} />
          <Link
            to="/cart"
            className="focus-ring rounded-control text-meta text-ink-muted underline-offset-4 hover:text-ink hover:underline"
          >
            View cart
          </Link>
        </div>

        <div className="mt-8 border-t border-hairline pt-8">
          <h2 className="rail">Description</h2>
          {product.description ? (
            // whitespace-pre-line keeps any line breaks an admin typed in.
            // max-w caps the measure at roughly 68 characters; without it a
            // description runs the full container width and stops being readable.
            <p className="mt-3 max-w-[68ch] text-body whitespace-pre-line text-ink-muted">
              {product.description}
            </p>
          ) : (
            <p className="mt-3 text-body text-ink-faint italic">No description provided.</p>
          )}
        </div>

        {/*
          The spec table, demoted below the action it used to compete with. Same
          content as before — nothing removed — but it no longer sits between the
          price and the buy control.
        */}
        <dl className="hairline-grid mt-8">
          <div className="bg-surface p-5">
            <dt className="rail">Product ID</dt>
            <dd className="mt-2 font-mono text-rail break-all text-ink-muted">{product.id}</dd>
          </div>
        </dl>
      </article>
    );
  }

  return (
    <AppLayout>
      {/* Always rendered, at a fixed position, so every state below — loading,
          404, loaded — has the same way back to the catalog. Plain Link rather
          than history.back(): arriving from a shared URL has nothing to go back
          to, and the filters live in the catalog URL anyway. */}
      <Link to="/products" className="focus-ring inline-flex items-center gap-1.5 rounded-control text-meta text-ink-subtle transition hover:text-ink">
        <ArrowLeftIcon /> Back to products
      </Link>

      <div className="mt-6">{renderProduct()}</div>
    </AppLayout>
  );
}

function ProductDetailSkeleton() {
  return (
    <div
      className="animate-pulse surface p-6 sm:p-8"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading product</span>
      <div className="h-3 w-24 rounded bg-skeleton" />
      <div className="mt-3 h-7 w-2/3 rounded bg-skeleton" />
      <div className="mt-5 h-9 w-32 rounded bg-skeleton" />
      <div className="mt-6 border-t border-hairline pt-6">
        <div className="h-4 w-full rounded bg-skeleton" />
        <div className="mt-2 h-4 w-4/5 rounded bg-skeleton" />
      </div>
      <div className="mt-6 h-24 rounded-panel bg-skeleton" />
    </div>
  );
}
