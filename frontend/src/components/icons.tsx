/**
 * The icon set: drawn paths at one stroke weight, in the board's own line language.
 *
 * These replaced unicode glyphs standing in for icons — `←` in the back links and
 * `−` / `+` on the quantity stepper. A glyph borrows whatever the text face happens
 * to draw at whatever weight the surrounding type is set in, which is why the old
 * stepper's minus and plus never matched each other optically.
 *
 * `×` between a price and a quantity is NOT here on purpose: that one is a real
 * multiplication sign doing typographic work, not an icon.
 *
 * All three inherit `currentColor` and size from the 1em box, so a control's colour
 * and scale carry into them without a prop.
 */

const STROKE = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      className="size-[1em] shrink-0"
      {...STROKE}
    >
      {children}
    </svg>
  );
}

export function ArrowLeftIcon() {
  return (
    <Svg>
      <path d="M13 8H3" />
      <path d="M6.5 4.5 3 8l3.5 3.5" />
    </Svg>
  );
}

export function MinusIcon() {
  return (
    <Svg>
      <path d="M3.5 8h9" />
    </Svg>
  );
}

export function PlusIcon() {
  return (
    <Svg>
      <path d="M3.5 8h9" />
      <path d="M8 3.5v9" />
    </Svg>
  );
}
