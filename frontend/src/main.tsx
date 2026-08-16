import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { AuthProvider } from "./auth/AuthProvider";
import { CartProvider } from "./cart/CartProvider";
import "./index.css";

/*
 * Two retries, then give up and let the page render its error state. A read
 * that has failed three times is not going to come good on a fourth while
 * someone sits watching a skeleton.
 */
const MAX_QUERY_RETRIES = 2;

/*
 * Backoff, capped. The attempts land at 1s and 2s, so a doomed query settles
 * into its error state in about three seconds.
 *
 * The cap is stated here rather than inherited: TanStack's default ceiling is
 * 30s, which is the right number for a background sync and far too long for a
 * person waiting on a list to appear.
 */
const RETRY_DELAY_CAP_MS = 3000;

/*
 * WHY A FAILING QUERY CAN LOOK LIKE IT NEVER SETTLES
 *
 * Worth writing down, because it cost a real investigation and looks exactly
 * like a bug in this config.
 *
 * TanStack pauses the gap between retries when the document is hidden —
 * `focusManager.isFocused()` is `document.visibilityState !== "hidden"`. A
 * query in that state reports `fetchStatus: "paused"` and keeps
 * `status: "pending"`, so `isError` never becomes true and the page shows its
 * skeleton indefinitely. It resumes, retries, and settles the moment the tab
 * is looked at again.
 *
 * That is deliberate library behaviour and it is right: there is no sense
 * burning retries against a tab nobody is watching. It is NOT something to
 * switch off here. It does mean that automated checks driving a background tab
 * will see a query stall forever and conclude the error state is unreachable —
 * it isn't, it is waiting for focus. Reproduce error states in a visible tab,
 * or call `focusManager.setFocused(true)` in the harness.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A 401 or 403 will never succeed on retry — retrying just delays the
      // redirect to /login and hides the real error behind a spinner.
      retry: (failureCount, error) => {
        const status = (error as { status?: number }).status;
        if (status !== undefined && status >= 400 && status < 500) return false;
        return failureCount < MAX_QUERY_RETRIES;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, RETRY_DELAY_CAP_MS),
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* Router outside AuthProvider: the provider's redirects run through
          react-router, so it has to sit inside a router context. */}
      <BrowserRouter>
        <AuthProvider>
          {/* Inside AuthProvider, but deliberately not tied to it: the cart is
              not cleared when a session ends, so a token expiring mid-checkout
              doesn't take the user's basket with it. See cart/cartStorage.ts. */}
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
