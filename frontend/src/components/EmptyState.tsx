import type { ReactNode } from "react";

/**
 * Placeholder for "the request succeeded and there is nothing to show".
 *
 * A dashed-frame card, matching the reference. Pass `icon` for the states that
 * want one (empty cart, empty order history) — it renders in a tinted brand
 * circle above the title, as in the mockup. `action` is the way out — clearing a
 * filter, or getting back to browsing.
 *
 * Distinct from ErrorBanner on purpose: an empty result is not a failure, and
 * styling it like one makes users think something broke.
 */
export function EmptyState({
  title,
  message,
  icon,
  action,
}: {
  title: string;
  message: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-panel border border-dashed border-edge bg-surface px-6 py-14 text-center">
      {icon && (
        <span className="grid size-14 place-items-center rounded-full bg-brand-surface text-2xl text-brand">
          {icon}
        </span>
      )}
      <div className="flex flex-col gap-1.5">
        <p className="condensed text-row font-bold text-ink">{title}</p>
        <p className="mx-auto max-w-[60ch] text-body text-ink-subtle">{message}</p>
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
