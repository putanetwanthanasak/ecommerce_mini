import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { buttonClass } from "../components/buttonStyles";
import { EmptyState } from "../components/EmptyState";
import { ErrorBanner } from "../components/ErrorBanner";
import { Pagination } from "../components/Pagination";
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
          title="No orders yet"
          message="Orders you place will appear here, with what you paid for each item."
          action={
            <Link to="/products" className={buttonClass()}>
              Browse the catalog
            </Link>
          }
        />
      );
    }

    return (
      <div className="space-y-6">
        <ul
          aria-busy={isRefreshing}
          className={`divide-y divide-hairline overflow-hidden surface transition-opacity ${
            isRefreshing ? "opacity-60" : "opacity-100"
          }`}
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
    <AppLayout>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="condensed text-row font-bold tracking-[0.14em] text-ink uppercase">Your orders</h1>
        {pagination && pagination.total > 0 && (
          <p className="text-meta text-ink-subtle">
            {pagination.total} {pagination.total === 1 ? "order" : "orders"}
          </p>
        )}
      </div>

      <div className="mt-6">{renderContent()}</div>
    </AppLayout>
  );
}

function OrderRow({ order }: { order: Order }) {
  const itemCount = countOrderItems(order);

  return (
    <li>
      <Link
        to={`/orders/${order.id}`}
        // The ring stays inset here rather than using the shared `focus-ring`
        // utility: these rows are flush inside a bordered list, so an offset
        // outline would be clipped by the container's overflow-hidden.
        className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 transition outline-none hover:bg-surface-sunken focus-visible:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
      >
        <div className="min-w-40 flex-1">
          <p className="font-mono text-meta font-medium text-ink">
            #{shortOrderId(order.id)}
          </p>
          <p className="mt-0.5 text-meta text-ink-subtle">
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

        <OrderStatusBadge status={order.status} />

        {/* The order's own total, recorded when it was placed — never re-derived
            from today's product prices. See frontend invariant 13. */}
        <span className="figures w-24 text-right text-meta text-ink">
          {formatPrice(order.totalPrice)}
        </span>
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
    <ul
      className="divide-y divide-hairline overflow-hidden surface"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading your orders</span>
      {Array.from({ length: 4 }, (_, i) => (
        <li key={i} className="flex animate-pulse items-center gap-4 px-5 py-4">
          <div className="flex-1">
            <div className="h-4 w-24 rounded bg-skeleton" />
            <div className="mt-2 h-3 w-40 rounded bg-skeleton" />
          </div>
          <div className="h-5 w-16 rounded-control bg-skeleton" />
          <div className="h-4 w-16 rounded bg-skeleton" />
        </li>
      ))}
    </ul>
  );
}
