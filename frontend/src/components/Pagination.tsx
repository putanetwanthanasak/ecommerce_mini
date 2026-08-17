import { Button } from "./Button";
import type { PageInfo } from "../lib/pagination";

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
      className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-5"
    >
      <p className="text-meta text-ink-subtle">
        {/* Concrete numbers beat "Page 2 of 5" alone — they tell the user how
            much is actually behind the filter they just applied. */}
        Showing <span className="figures text-ink-muted">{firstOnPage}</span>–
        <span className="figures text-ink-muted">{lastOnPage}</span> of{" "}
        <span className="figures text-ink-muted">{total}</span>
      </p>

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => onPageChange(page - 1)} disabled={busy || page <= 1}>
          Previous
        </Button>
        <span className="rail px-1">
          Page {page} of {totalPages}
        </span>
        <Button
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={busy || page >= totalPages}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
