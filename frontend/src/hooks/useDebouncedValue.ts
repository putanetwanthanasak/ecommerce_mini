import { useEffect, useState } from "react";

/**
 * Returns `value` after it has stopped changing for `delayMs`.
 *
 * Used by the catalog search box so typing "keyboard" issues one request
 * instead of eight. The input itself stays uncontrolled-feeling and updates on
 * every keystroke — only the value that drives fetching is delayed.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    // Every new keystroke cancels the pending timer, so the delay is measured
    // from the *last* change rather than the first.
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
