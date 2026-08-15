import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/authContext";

/**
 * Shell for every signed-in page — the counterpart to AuthLayout.
 *
 * The header used to live inline in HomePage; it moved here when the catalog
 * added a second and third page that need the same brand/identity/log-out row.
 * One container width for all of them keeps the header aligned with the
 * content underneath it.
 */
export function AppLayout({ children }: { children: ReactNode }) {
  const { user, role, logout } = useAuth();
  const isAdmin = role === "ADMIN";

  return (
    <div className="min-h-dvh">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link
            to="/products"
            className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase transition hover:text-slate-600"
          >
            Commerce
          </Link>

          <div className="flex items-center gap-3">
            {user && (
              <Link
                to="/account"
                className="hidden text-sm text-slate-600 underline-offset-4 hover:underline sm:inline"
              >
                {user.name}
              </Link>
            )}
            {isAdmin && (
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-white">
                Admin
              </span>
            )}
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
