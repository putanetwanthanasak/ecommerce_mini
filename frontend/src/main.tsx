import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { AuthProvider } from "./auth/AuthProvider";
import { CartProvider } from "./cart/CartProvider";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A 401 or 403 will never succeed on retry — retrying just delays the
      // redirect to /login and hides the real error behind a spinner.
      retry: (failureCount, error) => {
        const status = (error as { status?: number }).status;
        if (status !== undefined && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
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
