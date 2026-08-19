import { Link } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { AppLayout } from "../components/AppLayout";

/**
 * The account page, at /account.
 *
 * This was the app's home page while auth was all that existed; the catalog
 * took that spot, and what's left is the session detail it always showed. The
 * header, including log out, now lives in AppLayout alongside every other
 * signed-in page.
 */
export function HomePage() {
  const { user, role } = useAuth();
  if (!user) return null; // ProtectedRoute guarantees this; satisfies the type.

  const isAdmin = role === "ADMIN";

  return (
    <AppLayout>
      <h1 className="condensed text-row font-bold tracking-[0.14em] text-ink uppercase">{user.name}</h1>
      <p className="mt-1.5 text-meta text-ink-subtle">{user.email}</p>

      <dl className="mt-8 hairline-grid sm:grid-cols-2">
        <div className="bg-surface p-5">
          <dt className="text-rail font-medium tracking-wide text-ink-subtle uppercase">Role</dt>
          <dd className="mt-1.5 flex items-center gap-2">
            <span className="text-meta font-medium text-ink">{role}</span>
            {isAdmin && (
              <span className="rounded-full bg-ink px-2 py-0.5 text-rail font-medium text-board">
                Admin
              </span>
            )}
          </dd>
        </div>
        <div className="bg-surface p-5">
          <dt className="text-rail font-medium tracking-wide text-ink-subtle uppercase">User ID</dt>
          <dd className="mt-1.5 font-mono text-rail break-all text-ink-muted">{user.id}</dd>
        </div>
      </dl>

      <p className="mt-8 text-meta text-ink-subtle">
        <Link to="/products" className="font-medium text-ink underline underline-offset-4">
          Browse the catalog
        </Link>
        {" or review "}
        <Link to="/orders" className="font-medium text-ink underline underline-offset-4">
          your orders
        </Link>
        {isAdmin && " — admin tools (product and order management) land in a later phase."}
      </p>
    </AppLayout>
  );
}
