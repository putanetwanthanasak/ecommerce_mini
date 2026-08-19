import { Button } from "../components/Button";
import { MinusIcon, PlusIcon } from "../components/icons";

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
      <Button
        size="icon"
        disabled={disabled || quantity <= 1}
        onClick={() => onChange(quantity - 1)}
        aria-label={`Decrease quantity of ${label}`}
      >
        <MinusIcon />
      </Button>

      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={Math.max(max, 1)}
        value={quantity}
        disabled={disabled}
        onChange={(event) => handleTyped(event.target.value)}
        aria-label={`Quantity of ${label}`}
        className="focus-ring h-8 w-14 rounded-control border border-edge px-2 text-center text-meta text-ink disabled:bg-surface-sunken disabled:text-ink-faint"
      />

      <Button
        size="icon"
        disabled={disabled || atMax}
        onClick={() => onChange(quantity + 1)}
        aria-label={`Increase quantity of ${label}`}
      >
        <PlusIcon />
      </Button>
    </div>
  );
}
