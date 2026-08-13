import { useAuth } from "../auth/authContext";

/**
 * Placeholder home page — proves the auth loop end to end and nothing more.
 * The catalog, cart and admin screens are a later phase.
 */
export function HomePage() {
  const { user, role, logout } = useAuth();
  if (!user) return null; // ProtectedRoute guarantees this; satisfies the type.

  const isAdmin = role === "ADMIN";

  return (
    <div className="min-h-dvh">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">Commerce</p>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Signed in as {user.name}
        </h1>
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

        {/* The role is what later phases branch on — admin gets product and order
            management, customers get the catalog. Both are still to build. */}
        <p className="mt-8 text-sm text-slate-500">
          {isAdmin
            ? "Admin tools (product and order management) land in a later phase."
            : "The product catalog lands in a later phase."}
        </p>
      </main>
    </div>
  );
}
