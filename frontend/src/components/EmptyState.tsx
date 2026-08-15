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
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
