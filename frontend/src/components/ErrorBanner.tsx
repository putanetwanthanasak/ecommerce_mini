import { ApiError } from "../lib/api";

interface ErrorBannerProps {
  error: unknown;
  /**
   * Fields the form renders inline (via FormField). Validation details for
   * these are shown at their inputs, so the banner skips them; anything else
   * the backend sent still surfaces here instead of vanishing.
   */
  handledFields?: string[];
  /**
   * Try the failed request again.
   *
   * Pass this wherever the failure was a *read* — the fix is always "ask
   * again", and making the user hunt for a way to do that is what turns a
   * blip into a dead end.
   *
   * Deliberately optional, because retrying is not universally safe or
   * meaningful:
   *   - a failed login is retried by correcting the form and submitting it,
   *     so the submit button already is the retry;
   *   - a failed POST /api/orders must NOT get a one-click retry. The backend
   *     has no idempotency key, so a retry that actually succeeded the first
   *     time places a second order (see CLAUDE.md, frontend invariant 11).
   * Omit it in those cases rather than wiring it up to something clever.
   */
  onRetry?: () => void;
  /** True while a retry is in flight — disables the button so it can't stack. */
  retrying?: boolean;
}

/**
 * Renders what the backend actually said, and offers the way out.
 *
 * A validation failure returns { error: "Validation failed", details: [...] }.
 * Printing the top-level message alone would tell the user nothing about which
 * field is wrong, so the details drive the display.
 */
export function ErrorBanner({
  error,
  handledFields = [],
  onRetry,
  retrying = false,
}: ErrorBannerProps) {
  const messages = toMessages(error, handledFields);
  if (messages.length === 0) return null;

  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
    >
      {messages.length === 1 ? (
        messages[0]
      ) : (
        <ul className="list-inside list-disc space-y-1">
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      {onRetry && (
        <div className="mt-2.5">
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition outline-none hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {retrying ? "Retrying…" : "Try again"}
          </button>
        </div>
      )}
    </div>
  );
}

function toMessages(error: unknown, handledFields: string[]): string[] {
  if (!error) return [];

  if (error instanceof ApiError) {
    if (error.details.length === 0) return [error.message];

    const unhandled = error.details
      .filter((detail) => !handledFields.includes(detail.path))
      .map((detail) => (detail.path ? `${detail.path}: ${detail.message}` : detail.message));

    // Every detail already has an input showing it — the banner would just be
    // noise repeating "Validation failed".
    return unhandled;
  }

  return [error instanceof Error ? error.message : "Something went wrong."];
}
