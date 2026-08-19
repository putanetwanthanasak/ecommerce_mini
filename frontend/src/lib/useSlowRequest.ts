import { useEffect, useState } from "react";

/**
 * True once `pending` has been true continuously for `afterMs`.
 *
 * Exists for one concrete deployment fact: the API is on Render's free tier,
 * which stops the container after ~15 minutes idle. The next request has to wait
 * for a cold start — measured at roughly 30-50 seconds. A warm request answers in
 * a few hundred milliseconds, so a submit that is still running after a few
 * seconds is almost certainly waking the server, and the user deserves to be told
 * that rather than left watching a button that looks stuck.
 *
 * The delay matters: showing the notice immediately would make every normal
 * login look slow and broken.
 *
 * Resets when `pending` goes false, so a second attempt starts the clock again.
 */
export function useSlowRequest(pending: boolean, afterMs = 4000): boolean {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!pending) {
      setSlow(false);
      return;
    }
    const timer = setTimeout(() => setSlow(true), afterMs);
    return () => clearTimeout(timer);
  }, [pending, afterMs]);

  return slow;
}
