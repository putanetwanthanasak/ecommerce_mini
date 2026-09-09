import type { ReactNode } from "react";

/**
 * The pill shape shared by stock state and order status.
 *
 * Only the shape and the tone table live here. The wording and the
 * state-to-tone mapping stay in their own components, because those
 * two mean different things and should stay free to diverge — "Only 2 left" is
 * a live inventory fact, "Shipped" is a terminal record. Merging them into one
 * component with a `kind` prop would tie two unrelated vocabularies together.
 *
 * What was actually duplicated was the base string, character for character, in
 * both files. That is what this removes.
 */

export type BadgeTone = "neutral" | "positive" | "caution" | "critical" | "info";

const TONES: Record<BadgeTone, string> = {
  neutral: "border-hairline bg-surface-muted text-ink-subtle",
  positive: "border-positive-edge bg-positive-surface text-positive",
  caution: "border-caution-edge bg-caution-surface text-caution",
  critical: "border-critical-edge bg-critical-surface text-critical",
  info: "border-info-edge bg-info-surface text-info",
};

export function Badge({
  tone,
  icon,
  children,
}: {
  tone: BadgeTone;
  /** An optional leading glyph — a drawn icon from components/icons. StockBadge
   *  uses it for the per-state mark; OrderStatusBadge renders text only. */
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className={`badge ${TONES[tone]}${icon ? " gap-1.5 [&_svg]:size-3.5" : ""}`}>
      {icon}
      {children}
    </span>
  );
}
