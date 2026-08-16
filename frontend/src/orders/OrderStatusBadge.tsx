import type { OrderStatus } from "./ordersApi";

const BASE = "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium";

/**
 * Colour per status, in one table.
 *
 * The progression reads as one: amber is waiting on someone, sky is money
 * settled, emerald is done and gone. CANCELLED is deliberately grey rather than
 * red — a customer who cancelled their own order has not encountered an error,
 * and red would tell them something is wrong every time they open their
 * history. It reads as terminal and closed, which is what it is.
 *
 * Keyed by the enum so a status added to the backend's OrderStatus becomes a
 * type error here rather than silently rendering as an unstyled pill.
 */
const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  PAID: "border-sky-200 bg-sky-50 text-sky-800",
  SHIPPED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-slate-200 bg-slate-100 text-slate-500",
};

/** Sentence case reads better in a table than the raw SHOUTING enum. */
const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  SHIPPED: "Shipped",
  CANCELLED: "Cancelled",
};

/**
 * An order's status as a badge.
 *
 * Lives in orders/ rather than inside a page because the admin screens will
 * render the same four states next round, and two tables disagreeing about what
 * colour SHIPPED is would be the obvious thing to get wrong.
 */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`${BASE} ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>;
}
