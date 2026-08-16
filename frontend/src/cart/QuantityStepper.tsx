const BUTTON =
  "h-8 w-8 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 transition outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-white";

interface QuantityStepperProps {
  quantity: number;
  /** Last-known stock. Advisory — see the note in cartTypes.ts. */
  max: number;
  disabled?: boolean;
  label: string;
  onChange: (quantity: number) => void;
}

/**
 * Quantity control for one cart line.
 *
 * The cap comes from stock, and it is a courtesy rather than a guarantee: it
 * catches the obvious "I'll take 40 of them" before it becomes a failed
 * checkout, but the number it caps against can be minutes old. The backend's
 * `stock >= quantity` guard inside the order transaction is the real limit.
 *
 * The typed input is clamped rather than rejected — someone who types 99 into a
 * box with 4 in stock gets 4 and can see what happened, which beats an input
 * that silently refuses their keystrokes.
 */
export function QuantityStepper({
  quantity,
  max,
  disabled = false,
  label,
  onChange,
}: QuantityStepperProps) {
  const atMax = quantity >= max;

  function handleTyped(raw: string) {
    const parsed = Number.parseInt(raw, 10);
    // An empty or half-typed box isn't a quantity yet — leave the current value
    // alone rather than snapping to 1 while the user is mid-keystroke.
    if (!Number.isFinite(parsed)) return;
    onChange(Math.min(Math.max(parsed, 1), Math.max(max, 1)));
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        className={BUTTON}
        disabled={disabled || quantity <= 1}
        onClick={() => onChange(quantity - 1)}
        aria-label={`Decrease quantity of ${label}`}
      >
        −
      </button>

      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={Math.max(max, 1)}
        value={quantity}
        disabled={disabled}
        onChange={(event) => handleTyped(event.target.value)}
        aria-label={`Quantity of ${label}`}
        className="h-8 w-14 rounded-lg border border-slate-300 px-2 text-center text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
      />

      <button
        type="button"
        className={BUTTON}
        disabled={disabled || atMax}
        onClick={() => onChange(quantity + 1)}
        aria-label={`Increase quantity of ${label}`}
      >
        +
      </button>
    </div>
  );
}
