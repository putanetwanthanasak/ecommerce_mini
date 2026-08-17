import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { CartBadge } from "../cart/CartBadge";
import { Button } from "./Button";

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
      {/*
        The board's header rail. Darker than the flaps below it rather than lighter, so it
        reads as the chassis the mechanism is mounted in, and it carries the one hairline
        that separates the board's frame from its rows.
      */}
      <header className="border-b border-hairline bg-board">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-6 py-4">
          {/*
            The wordmark was 12px in the third-lightest grey available — quieter than every
            badge on the page, in a slot designed to be invisible. On a departures board the
            operator's name is set in the same condensed caps as the destinations, at a size
            that admits it owns the board.
          */}
          <Link
            to="/products"
            className="focus-ring condensed rounded-control text-row leading-none font-bold tracking-[0.16em] text-ink uppercase transition hover:text-amber"
          >
            Commerce
          </Link>

          <div className="flex flex-wrap items-center justify-end gap-3">
            {/* Without this the history is reachable only by typing the URL or
                by having just checked out. */}
            <Link
              to="/orders"
              className="focus-ring rail rounded-control transition hover:text-ink"
            >
              Orders
            </Link>
            {user && (
              <Link
                to="/account"
                className="focus-ring rail hidden rounded-control transition hover:text-ink sm:inline"
              >
                {user.name}
              </Link>
            )}
            {isAdmin && <span className="badge border-edge text-ink-muted">Admin</span>}
            <CartBadge />
            {/*
              Log out went through Button specifically because it had lost its
              focus ring while every control beside it kept one — the single
              destructive action in the header was the one a keyboard user
              could not see themselves land on.
            */}
            <Button size="sm" onClick={logout}>
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
