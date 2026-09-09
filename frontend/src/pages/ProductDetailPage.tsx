import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { buttonClass } from "../components/buttonStyles";
import { EmptyState } from "../components/EmptyState";
import { ArrowLeftIcon } from "../components/icons";
import { ErrorBanner } from "../components/ErrorBanner";
import { ProductImage } from "../catalog/ProductImage";
import { ProductPurchase } from "../cart/ProductPurchase";
import { StockBadge } from "../catalog/StockBadge";
import { catalogKeys, fetchProduct } from "../catalog/catalogApi";
import { ApiError } from "../lib/api";
import { formatPrice } from "../lib/money";

/**
 * One product, at /products/:id — a two-column layout matching the reference:
 * a square image (with the stock badge in its corner) on the left, and the
 * category, name, price, description and the quantity / add-to-cart control on
 * the right.
 */
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
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="relative aspect-square overflow-hidden rounded-panel border border-hairline bg-surface-muted">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full"
            fallbackIconClassName="text-5xl"
          />
          <div className="absolute top-4 left-4">
            <StockBadge stock={product.stock} />
          </div>
        </div>

        <div className="flex flex-col">
          <Link
            to={`/products?categoryId=${product.categoryId}`}
            className="focus-ring rail self-start rounded-control transition hover:text-brand"
          >
            {product.category.name}
          </Link>

          <h1 className="condensed mt-1 text-title font-bold tracking-tight text-balance text-ink">
            {product.name}
          </h1>

          <p className="figures mt-4 text-title text-ink">{formatPrice(product.price)}</p>

          {/* One quiet line so a page held open on a stale tab doesn't mislead:
              the numbers above are re-checked server-side when the order runs. */}
          <p className="mt-1.5 text-meta text-ink-subtle">
            Price and stock are confirmed by the server at checkout.
          </p>

          <p className="mt-6 max-w-[60ch] text-body whitespace-pre-line text-ink-muted">
            {product.description ?? "No description provided."}
          </p>

          <div className="mt-8 border-t border-hairline pt-8">
            <ProductPurchase product={product} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      {/* Always rendered, at a fixed position, so every state below — loading,
          404, loaded — has the same way back to the catalog. */}
      <Link
        to="/products"
        className="focus-ring inline-flex items-center gap-1.5 rounded-control text-meta font-medium text-ink-subtle transition hover:text-ink"
      >
        <ArrowLeftIcon /> Back to products
      </Link>

      <div className="mt-6">{renderProduct()}</div>
    </AppLayout>
  );
}

function ProductDetailSkeleton() {
  return (
    <div
      className="grid animate-pulse gap-8 lg:grid-cols-2 lg:gap-12"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading product</span>
      <div className="aspect-square w-full rounded-panel border border-hairline bg-skeleton" />
      <div className="flex flex-col">
        <div className="h-3 w-24 rounded bg-skeleton" />
        <div className="mt-3 h-8 w-2/3 rounded bg-skeleton" />
        <div className="mt-5 h-7 w-28 rounded bg-skeleton" />
        <div className="mt-6 space-y-2">
          <div className="h-4 w-full rounded bg-skeleton" />
          <div className="h-4 w-4/5 rounded bg-skeleton" />
        </div>
        <div className="mt-8 h-11 w-40 rounded-control bg-skeleton" />
      </div>
    </div>
  );
}
