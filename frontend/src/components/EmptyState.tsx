import type { ReactNode } from "react";

/**
 * Placeholder for "the request succeeded and there is nothing to show".
 *
 * Distinct from ErrorBanner on purpose: an empty result is not a failure, and
 * styling it like one makes users think something broke. `action` is where the
 * way out goes — clearing a filter, or getting back to page 1.
 */
export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-panel border border-dashed border-edge bg-surface px-6 py-14 text-center">
      <p className="condensed text-row font-bold text-ink">{title}</p>
      <p className="mx-auto mt-3 max-w-[60ch] text-body text-ink-subtle">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
