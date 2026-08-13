import { ApiError } from "../lib/api";

interface ErrorBannerProps {
  error: unknown;
  /**
   * Fields the form renders inline (via FormField). Validation details for
   * these are shown at their inputs, so the banner skips them; anything else
   * the backend sent still surfaces here instead of vanishing.
   */
  handledFields?: string[];
}

/**
 * Renders what the backend actually said.
 *
 * A validation failure returns { error: "Validation failed", details: [...] }.
 * Printing the top-level message alone would tell the user nothing about which
 * field is wrong, so the details drive the display.
 */
export function ErrorBanner({ error, handledFields = [] }: ErrorBannerProps) {
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
