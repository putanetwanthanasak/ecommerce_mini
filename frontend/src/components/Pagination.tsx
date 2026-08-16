import type { PageInfo } from "../lib/pagination";

const BUTTON =
  "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white";

interface PaginationProps {
  pagination: PageInfo;
  onPageChange: (page: number) => void;
  /** True while a page change is in flight — keeps the user from queueing jumps. */
  busy?: boolean;
  /**
   * What is being paged through, for the landmark's accessible name.
   *
   * A page with more than one paged list gives screen reader users two
   * identically-named navigation landmarks, which is no help at all.
   */
  label?: string;
}

/**
 * Prev/next built from the backend's `totalPages`.
 *
 * The buttons are disabled at the boundaries rather than clamped after the
 * fact: there is no point issuing a request for page 0 (a 400) or page 99 (an
 * empty list that reads like "no results") when we already know the range.
 *
 * It lives in components/ rather than catalog/ because the order history pages
 * through the identical envelope. A second copy would drift from this one.
 */
export function Pagination({
  pagination,
  onPageChange,
  busy = false,
  label = "Pages",
}: PaginationProps) {
  const { page, limit, total, totalPages } = pagination;

  // One page of results needs no controls at all.
  if (totalPages <= 1) return null;

  const firstOnPage = (page - 1) * limit + 1;
  const lastOnPage = Math.min(page * limit, total);

  return (
    <nav
      aria-label={label}
      className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5"
    >
      <p className="text-sm text-slate-500">
        {/* Concrete numbers beat "Page 2 of 5" alone — they tell the user how
            much is actually behind the filter they just applied. */}
        Showing <span className="font-medium text-slate-700">{firstOnPage}</span>–
        <span className="font-medium text-slate-700">{lastOnPage}</span> of{" "}
        <span className="font-medium text-slate-700">{total}</span>
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className={BUTTON}
          onClick={() => onPageChange(page - 1)}
          disabled={busy || page <= 1}
        >
          Previous
        </button>
        <span className="px-1 text-sm text-slate-500" aria-current="page">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className={BUTTON}
          onClick={() => onPageChange(page + 1)}
          disabled={busy || page >= totalPages}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
