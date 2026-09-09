import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { CartBadge } from "../cart/CartBadge";
import { Button } from "./Button";
import { BagIcon, LogOutIcon, PackageIcon } from "./icons";

/**
 * Shell for every signed-in page — the counterpart to AuthLayout.
 *
 * The header used to live inline in HomePage; it moved here when the catalog
 * added a second and third page that need the same brand/identity/log-out row.
 *
 * The header always spans `max-w-6xl`. The content column matches the reference
 * mockup page by page: `6xl` for the catalog and product detail, `5xl` for the
 * cart and checkout, `4xl` for the order history, `3xl` for a single order.
 */
const CONTENT_WIDTH = {
  "6xl": "max-w-6xl",
  "5xl": "max-w-5xl",
  "4xl": "max-w-4xl",
  "3xl": "max-w-3xl",
} as const;

export function AppLayout({
  children,
  size = "6xl",
}: {
  children: ReactNode;
  size?: keyof typeof CONTENT_WIDTH;
}) {
  const { user, role, logout } = useAuth();
  const isAdmin = role === "ADMIN";

  return (
    <div className="min-h-dvh">
      {/*
        The header sits on the page's own background, not a raised bar — it is set
        off from the content below by a single hairline border, nothing more.
      */}
      <header className="border-b border-hairline bg-board">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-6 py-4">
          {/*
            The wordmark: a brand-purple bag tile, then the name in tracked caps.
            "Limina" replaced "Commerce", which was always flagged a placeholder.
          */}
          <Link
            to="/products"
            className="focus-ring flex items-center gap-2 rounded-control"
          >
            <span className="grid size-8 place-items-center rounded-control bg-brand text-brand-foreground">
              <BagIcon />
            </span>
            <span className="condensed text-row leading-none font-bold tracking-[0.16em] text-ink uppercase">
              Limina
            </span>
          </Link>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            {/* Without this the history is reachable only by typing the URL or
                by having just checked out. */}
            <Link
              to="/orders"
              className="focus-ring inline-flex items-center gap-1.5 rounded-control text-meta font-medium text-ink-subtle transition hover:text-ink"
            >
              <PackageIcon />
              <span className="hidden sm:inline">Orders</span>
            </Link>
            {user && (
              <Link
                to="/account"
                className="focus-ring hidden rounded-control text-meta font-medium text-ink transition hover:text-ink-muted sm:inline"
              >
                {user.name}
              </Link>
            )}
            {isAdmin && <span className="badge border-edge text-ink-muted">Admin</span>}
            <CartBadge />
            <Button size="sm" onClick={logout} aria-label="Log out">
              <LogOutIcon />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className={`mx-auto px-6 py-10 ${CONTENT_WIDTH[size]}`}>{children}</main>
    </div>
  );
}
