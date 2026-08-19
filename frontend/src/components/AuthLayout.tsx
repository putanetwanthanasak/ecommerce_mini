import type { ReactNode } from "react";

/** Shared shell for the login and register cards. */
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
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="condensed text-row font-bold tracking-[0.16em] text-ink uppercase">Commerce</p>
          <h1 className="condensed mt-4 text-title font-bold tracking-tight text-ink">{title}</h1>
          <p className="mt-1.5 text-meta text-ink-subtle">{subtitle}</p>
        </div>

        <div className="surface p-6">{children}</div>

        <p className="mt-6 text-center text-meta text-ink-subtle">{footer}</p>
      </div>
    </div>
  );
}
