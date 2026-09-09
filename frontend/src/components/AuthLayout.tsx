import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BagIcon } from "./icons";

/**
 * Shared shell for the login and register cards.
 *
 * The brand mark sits above the card, the title and subtitle move inside it, and
 * the whole stack is centred — the same card `surface` (radius, hairline, soft
 * shadow) the catalog and the rest of the app use. Presentation only; the forms
 * and their logic live in LoginPage / RegisterPage untouched.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-12">
      <Link
        to="/products"
        className="focus-ring flex items-center gap-2.5 rounded-control"
      >
        <span className="grid size-9 place-items-center rounded-control bg-brand text-brand-foreground">
          <BagIcon />
        </span>
        <span className="condensed text-row leading-none font-bold tracking-[0.16em] text-ink uppercase">
          Limina
        </span>
      </Link>

      <div className="surface w-full max-w-sm p-6 sm:p-8">
        <div className="text-center">
          <h1 className="condensed text-title font-bold tracking-tight text-balance text-ink">
            {title}
          </h1>
          <p className="mt-1.5 text-meta text-ink-subtle">{subtitle}</p>
        </div>

        <div className="mt-6">{children}</div>
      </div>

      <p className="text-center text-meta text-ink-subtle">{footer}</p>
    </main>
  );
}
