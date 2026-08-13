import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./authContext";
import { PageLoader } from "../components/PageLoader";

/**
 * Gate for authenticated pages.
 *
 * This is also what makes mid-session expiry graceful: a 401 on any call clears
 * the session in AuthProvider, this re-renders with isAuthenticated false, and
 * the user lands on /login instead of staring at a screen whose data never
 * arrived.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const location = useLocation();

  // A stored token hasn't been exchanged for a user yet. Redirecting now would
  // sign out anyone who simply refreshed the page.
  if (isBootstrapping) return <PageLoader label="Restoring your session" />;

  if (!isAuthenticated) {
    // `replace` keeps the protected URL out of history, so Back doesn't bounce
    // between it and /login. `state.from` lets login return them where they were.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

/**
 * Keeps a signed-in user off /login and /register.
 *
 * This is also what navigates after a successful sign-in — the login page
 * deliberately doesn't call navigate() itself, so there is exactly one rule for
 * where an authenticated user belongs and no race between the two.
 */
export function GuestOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) return <PageLoader />;

  if (isAuthenticated) {
    // Return them to the page that bounced them here, if there was one.
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from ?? "/"} replace />;
  }

  return <>{children}</>;
}
