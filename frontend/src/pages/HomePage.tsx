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
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{user.name}</h1>
      <p className="mt-1.5 text-sm text-slate-500">{user.email}</p>

      <dl className="mt-8 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2">
        <div className="bg-white p-5">
          <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">Role</dt>
          <dd className="mt-1.5 flex items-center gap-2">
            <span className="text-sm font-medium text-slate-900">{role}</span>
            {isAdmin && (
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-white">
                Admin
              </span>
            )}
          </dd>
        </div>
        <div className="bg-white p-5">
          <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">User ID</dt>
          <dd className="mt-1.5 font-mono text-xs break-all text-slate-600">{user.id}</dd>
        </div>
      </dl>

      <p className="mt-8 text-sm text-slate-500">
        <Link to="/products" className="font-medium text-slate-900 underline underline-offset-4">
          Browse the catalog
        </Link>
        {" or review "}
        <Link to="/orders" className="font-medium text-slate-900 underline underline-offset-4">
          your orders
        </Link>
        {isAdmin && " — admin tools (product and order management) land in a later phase."}
      </p>
    </AppLayout>
  );
}
