import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { buttonClass } from "../components/buttonStyles";
import { EmptyState } from "../components/EmptyState";
import { ErrorBanner } from "../components/ErrorBanner";
import { ChevronRightIcon, PackageIcon } from "../components/icons";
import { Pagination } from "../components/Pagination";
import { ProductImage } from "../catalog/ProductImage";
import { formatPrice } from "../lib/money";
import { countOrderItems, shortOrderId } from "../orders/orderDisplay";
import { OrderStatusBadge } from "../orders/OrderStatusBadge";
import { fetchOrders, orderKeys, type Order } from "../orders/ordersApi";
import { useOrderListParams } from "../orders/useOrderListParams";

export function OrderListPage() {
  const { params, setPage } = useOrderListParams();

  const query = useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => fetchOrders(params),
    // Hold the previous page while the next loads, so the list doesn't empty
    // and bounce the pagination controls up the page on every click.
    placeholderData: keepPreviousData,
  });

  const orders = query.data?.orders ?? [];
  const pagination = query.data?.pagination;
  const isRefreshing = query.isFetching && !query.isPending;

  function renderContent() {
    if (query.isPending) return <OrderListSkeleton />;

    // A failed fetch is not an empty history. Showing "you haven't ordered
    // anything yet" because the request fell over would be a lie about the
    // user's own records, and it hides the retry.
    if (query.isError) {
      return (
        <ErrorBanner
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      );
    }

    if (orders.length === 0) {
      // Past the last page — reachable by hand-editing ?page= or by opening a
      // stale link. Distinct from a genuinely empty history.
      if (pagination && pagination.total > 0) {
        return (
          <EmptyState
            title={`Page ${pagination.page} is past the end`}
            message={`You have ${pagination.total} ${
              pagination.total === 1 ? "order" : "orders"
            } across ${pagination.totalPages} ${pagination.totalPages === 1 ? "page" : "pages"}.`}
            action={
              <Button onClick={() => setPage(1)}>Back to page 1</Button>
            }
          />
        );
      }

      return (
        <EmptyState
          icon={<PackageIcon />}
          title="No orders yet"
          message="When you place an order, it'll show up here with what you paid for each item."
          action={
            <Link to="/products" className={buttonClass({ variant: "primary" })}>
              Browse products
            </Link>
          }
        />
      );
    }

    return (
      <div className="space-y-6">
        <ul
          aria-busy={isRefreshing}
          className={`space-y-4 transition-opacity ${isRefreshing ? "opacity-60" : "opacity-100"}`}
        >
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </ul>

        {pagination && (
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
            busy={isRefreshing}
            label="Order history pages"
          />
        )}
      </div>
    );
  }

  return (
    <AppLayout size="4xl">
      <h1 className="condensed text-title font-bold tracking-tight text-ink">Order history</h1>
      <p className="mt-1 text-meta text-ink-subtle">
        {pagination && pagination.total > 0
          ? `${pagination.total} ${pagination.total === 1 ? "order" : "orders"}`
          : "Your past orders"}
      </p>

      <div className="mt-8">{renderContent()}</div>
    </AppLayout>
  );
}

function OrderRow({ order }: { order: Order }) {
  const itemCount = countOrderItems(order);

  return (
    <li>
      <Link
        to={`/orders/${order.id}`}
        className="focus-ring surface card-interactive group flex items-center gap-4 p-4 sm:p-5"
      >
        {/* A stack of the first few items' thumbnails, matching the reference.
            Order lines carry no image URL from the API, so these are the neutral
            placeholder for now. */}
        <div className="flex -space-x-3">
          {order.items.slice(0, 3).map((item) => (
            <span
              key={item.id}
              className="size-14 shrink-0 overflow-hidden rounded-control border-2 border-surface bg-surface-muted"
            >
              <ProductImage src={null} alt="" className="size-full" fallbackIconClassName="text-base" />
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="figures text-ink">#{shortOrderId(order.id)}</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 truncate text-meta text-ink-subtle">
            <time dateTime={order.createdAt}>
              {new Date(order.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </time>
            {" · "}
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {/* The order's own total, recorded when it was placed — never
              re-derived from today's product prices. See frontend invariant 13. */}
          <span className="figures text-row text-ink">{formatPrice(order.totalPrice)}</span>
          <span className="text-ink-faint transition-transform group-hover:translate-x-0.5">
            <ChevronRightIcon />
          </span>
        </div>
      </Link>
    </li>
  );
}

/**
 * Same box model as a real row, so the switch from loading to loaded doesn't
 * reflow the list or bounce the pagination down the page.
 */
function OrderListSkeleton() {
  return (
    <ul className="space-y-4" role="status" aria-live="polite">
      <span className="sr-only">Loading your orders</span>
      {Array.from({ length: 4 }, (_, i) => (
        <li key={i} className="surface flex animate-pulse items-center gap-4 p-4 sm:p-5">
          <div className="flex -space-x-3">
            {Array.from({ length: 3 }, (_, j) => (
              <span
                key={j}
                className="size-14 shrink-0 rounded-control border-2 border-surface bg-skeleton"
              />
            ))}
          </div>
          <div className="flex-1">
            <div className="h-4 w-28 rounded bg-skeleton" />
            <div className="mt-2 h-3 w-40 rounded bg-skeleton" />
          </div>
          <div className="h-5 w-16 rounded bg-skeleton" />
        </li>
      ))}
    </ul>
  );
}
