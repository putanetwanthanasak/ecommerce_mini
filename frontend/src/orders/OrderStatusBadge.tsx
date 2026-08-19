import { Badge, type BadgeTone } from "../components/Badge";
import type { OrderStatus } from "./ordersApi";

/**
 * Tone per status, in one table.
 *
 * The progression reads as one: caution is waiting on someone, info is money
 * settled, positive is done and gone. CANCELLED is deliberately neutral rather
 * than critical — a customer who cancelled their own order has not encountered
 * an error, and red would tell them something is wrong every time they open
 * their history. Neutral reads as terminal and closed, which is what it is.
 *
 * Keyed by the enum so a status added to the backend's OrderStatus becomes a
 * type error here rather than silently rendering as an unstyled pill.
 */
const STATUS_TONES: Record<OrderStatus, BadgeTone> = {
  PENDING: "caution",
  PAID: "info",
  SHIPPED: "positive",
  CANCELLED: "neutral",
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
  return <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>;
}
