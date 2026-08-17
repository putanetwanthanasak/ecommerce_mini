import { Button } from "./Button";

/**
 * The submit control for the auth forms.
 *
 * Kept as its own component rather than replaced by a bare <Button> at the call
 * sites, because it owns one real decision: while a submit is in flight the
 * label becomes "Working…", so the button itself reports the request rather than
 * needing a spinner beside it. Both auth forms want that identically.
 */
export function SubmitButton({ pending, children }: { pending: boolean; children: string }) {
  return (
    <Button type="submit" variant="primary" fullWidth disabled={pending}>
      {pending ? "Working…" : children}
    </Button>
  );
}
