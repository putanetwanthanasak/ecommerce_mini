import { Button } from "./Button";
import { useSlowRequest } from "../lib/useSlowRequest";

/**
 * The submit control for the auth forms.
 *
 * Kept as its own component rather than replaced by a bare <Button> at the call
 * sites, because it owns two real decisions and both auth forms want them
 * identically.
 *
 * 1. While a submit is in flight the label becomes "Working…", so the button
 *    itself reports the request rather than needing a spinner beside it.
 *
 * 2. If the request is still running after a few seconds, it says why. The API
 *    runs on Render's free tier, which sleeps after ~15 minutes idle and then
 *    takes 30-50 seconds to answer the request that wakes it. Without this the
 *    first login of the day is indistinguishable from a hung app, and the
 *    natural reaction is to reload — which abandons the request that was
 *    already warming the server and starts the wait over.
 *
 *    Deliberately not a fix for the cold start, which is inherent to the free
 *    tier and not worth defeating with a keep-alive ping. It just makes the
 *    wait legible.
 */
export function SubmitButton({ pending, children }: { pending: boolean; children: string }) {
  const slow = useSlowRequest(pending);

  return (
    <div className="space-y-2">
      <Button type="submit" variant="primary" fullWidth disabled={pending}>
        {pending ? "Working…" : children}
      </Button>

      {slow && (
        // aria-live so a screen reader announces the explanation when it appears
        // — it shows up without any user action, which is exactly the case
        // polite live regions exist for.
        <p aria-live="polite" className="text-meta text-ink-muted">
          Still working — the server sleeps when idle, so the first request can
          take up to a minute. This will go through; no need to reload.
        </p>
      )}
    </div>
  );
}
