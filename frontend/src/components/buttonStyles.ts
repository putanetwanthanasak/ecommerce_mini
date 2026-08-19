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
 * Condensed with a little tracking, because on this board every control is a printed
 * label. It is the same lettering as the rails and the flap names, one step wider.
 */
const BASE =
  "focus-ring condensed inline-flex items-center justify-center gap-2 rounded-control font-semibold tracking-[0.03em] whitespace-nowrap transition disabled:cursor-not-allowed";

const VARIANTS: Record<ButtonVariant, string> = {
  /*
   * A primary control is a printed flap: the light card is the affordance, and the board
   * behind it supplies the text colour. Note `text-board`, not `text-white` — on this
   * inverted palette `bg-ink` IS near-white, so white text would be invisible.
   *
   * Amber is deliberately NOT used here. It is reserved for a figure that can still
   * change, and spending it on every button would strip the one signal the board exists
   * to send.
   *
   * Disabled reads as a filled-but-inert control rather than a faded one, because the
   * label carries information: "Out of stock" is the explanation for why the control is
   * dead, so it has to stay readable.
   */
  primary:
    "bg-ink text-board hover:bg-white disabled:bg-surface-muted disabled:text-ink-faint disabled:hover:bg-surface-muted",
  secondary:
    "border border-edge bg-surface text-ink-muted hover:border-ink-subtle hover:bg-surface-muted hover:text-ink disabled:opacity-40 disabled:hover:border-edge disabled:hover:bg-surface",
  /** The retry inside ErrorBanner: reads as part of the error, not a second alarm. */
  danger:
    "border border-critical-edge bg-critical-surface text-critical hover:bg-critical-surface/70 disabled:opacity-40",
  /*
   * For a control sitting on an already-tinted panel (the checkout error's
   * "Reduce to 1"). It borrows the panel's own text colour through currentColor
   * instead of naming a hue, so one definition works on the red and amber
   * notices alike — and the fill is the board showing through, not white.
   */
  "on-color":
    "border border-current/40 bg-board/40 text-current hover:bg-board/70 disabled:opacity-40 disabled:hover:bg-board/40",
};

const SIZES: Record<ButtonSize, string> = {
  /*
   * `md` is the default and clears 44px, the smallest comfortable touch target.
   * `sm` does not, so it belongs to pointer-dense chrome — pagination, the
   * header — and not to a primary action on a card a thumb has to hit. The grid
   * card currently breaks that rule; see the note in AddToCartButton.
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
