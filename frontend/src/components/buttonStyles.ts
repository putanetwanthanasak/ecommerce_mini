/**
 * The button's visual definition, in one place.
 *
 * This is a separate module from Button.tsx rather than living beside the
 * component, because roughly half the buttons in this app are actually `<Link>`s
 * — "Back to products", "Clear filters", "Go to your orders". A control that
 * navigates has to render an anchor so middle-click, ctrl-click and "copy link
 * address" behave, so those call sites need the classes without the element:
 *
 *     <Link to="/products" className={buttonClass()}>
 *
 * Keeping `buttonClass` out of the component file is also what lets React Fast
 * Refresh work: a module that exports both a component and a plain function
 * cannot be hot-swapped reliably, which oxlint flags.
 *
 * Before this existed, "the button" was thirteen hand-written class strings
 * across eleven files, and they had already drifted — three different disabled
 * treatments for the same primary button, two paddings for the same secondary
 * one, and a Log out button that had silently lost its focus ring.
 */

export type ButtonVariant = "primary" | "secondary" | "danger" | "on-color";
export type ButtonSize = "sm" | "md" | "icon";

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to the container. Used by the auth forms, where the card is the measure. */
  fullWidth?: boolean;
  /** Appended last, so a caller can still position the button (`relative`, `z-10`). */
  className?: string;
}

/*
 * Set in the display face with a little tracking, so every control reads as a
 * deliberate label — the same lettering as the rails and the product names.
 */
const BASE =
  "focus-ring condensed inline-flex items-center justify-center gap-2 rounded-control font-semibold tracking-[0.03em] whitespace-nowrap transition disabled:cursor-not-allowed";

const VARIANTS: Record<ButtonVariant, string> = {
  /*
   * The brand purple, with a near-white label — the primary action everywhere: add to
   * cart, checkout, place order, auth submits. `text-brand-foreground` rather than
   * `text-white` so it tracks the token. Hover darkens the fill a step.
   *
   * This replaced a dark `bg-ink` primary on 2026-09-09, when the project committed to
   * full parity with the reference mockup (which fills its primary with `--primary`,
   * the same purple). See DESIGN.md.
   *
   * Disabled just fades — a sold-out control uses the `secondary` variant with a Ban
   * icon and a "Sold out" label instead of a disabled primary, so nothing important is
   * being read off a faded button.
   */
  primary:
    "bg-brand text-brand-foreground hover:bg-brand/90 disabled:opacity-50 disabled:hover:bg-brand",
  secondary:
    "border border-edge bg-surface text-ink-muted hover:border-ink-subtle hover:bg-surface-muted hover:text-ink disabled:opacity-40 disabled:hover:border-edge disabled:hover:bg-surface",
  /** The retry inside ErrorBanner: reads as part of the error, not a second alarm. */
  danger:
    "border border-critical-edge bg-critical-surface text-critical hover:bg-critical-surface/70 disabled:opacity-40",
  /*
   * For a control sitting on an already-tinted panel (the checkout error's
   * "Reduce to 1"). It borrows the panel's own text colour through currentColor
   * instead of naming a hue, so one definition works on the red and amber
   * notices alike — and the fill is a wash of the page colour, not a flat white.
   */
  "on-color":
    "border border-current/40 bg-board/40 text-current hover:bg-board/70 disabled:opacity-40 disabled:hover:bg-board/40",
};

const SIZES: Record<ButtonSize, string> = {
  /*
   * `md` is the default and clears 44px, the smallest comfortable touch target.
   * `sm` does not, so it belongs to pointer-dense chrome — pagination, the
   * header — and not to a primary action a thumb has to hit. The catalog row's
   * add button currently breaks that rule; see the note in AddToCartButton.
   */
  md: "min-h-11 px-4 py-2.5 text-sm",
  sm: "px-3 py-1.5 text-sm",
  icon: "h-8 w-8 text-sm",
};

export function buttonClass({
  variant = "secondary",
  size = "md",
  fullWidth = false,
  className = "",
}: ButtonStyleOptions = {}): string {
  return [BASE, VARIANTS[variant], SIZES[size], fullWidth ? "w-full" : "", className]
    .filter(Boolean)
    .join(" ");
}
