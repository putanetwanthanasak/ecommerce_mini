/**
 * The icon set: drawn paths at one stroke weight, tuned to the weight of the type.
 *
 * These replaced unicode glyphs standing in for icons — `←` in the back links and
 * `−` / `+` on the quantity stepper. A glyph borrows whatever the text face happens
 * to draw at whatever weight the surrounding type is set in, which is why the old
 * stepper's minus and plus never matched each other optically.
 *
 * `×` between a price and a quantity is NOT here on purpose: that one is a real
 * multiplication sign doing typographic work, not an icon.
 *
 * They all inherit `currentColor` and size from the 1em box, so a control's colour
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

// Stand-in for a product with no image — a framed photo with a horizon and sun.
export function ImageIcon() {
  return (
    <Svg>
      <rect x="2" y="3" width="12" height="10" rx="1.5" />
      <circle cx="5.75" cy="6.25" r="1.15" />
      <path d="m2.5 11.5 3.25-3 2.25 2 2.75-2.75 2.75 2.75" />
    </Svg>
  );
}

// A shopping bag — the brand mark in the header and the cart control's glyph.
export function BagIcon() {
  return (
    <Svg>
      <path d="M4.25 5.5h7.5l.55 7.2a1.25 1.25 0 0 1-1.25 1.35H4.95a1.25 1.25 0 0 1-1.25-1.35z" />
      <path d="M6 5.5V5a2 2 0 0 1 4 0v.5" />
    </Svg>
  );
}

// The three stock-state marks, one per StockBadge tone.
export function CheckIcon() {
  return (
    <Svg>
      <path d="m3.5 8.5 3 3 6-6.5" />
    </Svg>
  );
}

export function AlertTriangleIcon() {
  return (
    <Svg>
      <path d="M8 2.75 14.5 13.5H1.5z" />
      <path d="M8 6.75v3" />
      <path d="M8 11.4h.01" />
    </Svg>
  );
}

export function XCircleIcon() {
  return (
    <Svg>
      <circle cx="8" cy="8" r="5.5" />
      <path d="m6 6 4 4" />
      <path d="m10 6-4 4" />
    </Svg>
  );
}
