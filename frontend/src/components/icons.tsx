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

// Order-status marks: PENDING clock, PAID check-in-circle, SHIPPED truck.
// CANCELLED reuses XCircleIcon above.
export function ClockIcon() {
  return (
    <Svg>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 4.75V8l2.25 1.5" />
    </Svg>
  );
}

export function CheckCircleIcon() {
  return (
    <Svg>
      <circle cx="8" cy="8" r="5.5" />
      <path d="m5.5 8 1.75 1.75L11 6" />
    </Svg>
  );
}

export function TruckIcon() {
  return (
    <Svg>
      <path d="M1.5 4.5h7v6.5h-7z" />
      <path d="M8.5 6.5h3l2 2v2.5h-5z" />
      <circle cx="4.5" cy="12" r="1.25" />
      <circle cx="11" cy="12" r="1.25" />
    </Svg>
  );
}

export function ChevronRightIcon() {
  return (
    <Svg>
      <path d="m6 3.5 4.5 4.5L6 12.5" />
    </Svg>
  );
}

export function TrashIcon() {
  return (
    <Svg>
      <path d="M3 4.5h10" />
      <path d="M5.5 4.5V3.25a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V4.5" />
      <path d="M4.25 4.5 4.75 13a1 1 0 0 0 1 .95h4.5a1 1 0 0 0 1-.95l.5-8.5" />
    </Svg>
  );
}

// A shopping cart — the add-to-cart action's glyph (the bag stays on the nav).
export function ShoppingCartIcon() {
  return (
    <Svg>
      <path d="M1.5 2h1.4l1.6 8.2a1 1 0 0 0 1 .8h6" />
      <path d="M4.1 4.5h9.2l-1 5H5z" />
      <circle cx="6" cy="13.5" r="0.6" />
      <circle cx="11.5" cy="13.5" r="0.6" />
    </Svg>
  );
}

// Struck circle — a disabled / sold-out control.
export function BanIcon() {
  return (
    <Svg>
      <circle cx="8" cy="8" r="5.5" />
      <path d="m4 4 8 8" />
    </Svg>
  );
}

export function SearchIcon() {
  return (
    <Svg>
      <circle cx="7" cy="7" r="4.25" />
      <path d="m10.25 10.25 3.25 3.25" />
    </Svg>
  );
}

export function ArrowRightIcon() {
  return (
    <Svg>
      <path d="M3 8h10" />
      <path d="M9.5 4.5 13 8l-3.5 3.5" />
    </Svg>
  );
}

export function LockIcon() {
  return (
    <Svg>
      <rect x="3.25" y="7" width="9.5" height="7" rx="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
    </Svg>
  );
}

export function AlertCircleIcon() {
  return (
    <Svg>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 5v3.5" />
      <path d="M8 10.75h.01" />
    </Svg>
  );
}

export function LogOutIcon() {
  return (
    <Svg>
      <path d="M6 2.5H3.25v11H6" />
      <path d="M9.5 8H13" />
      <path d="M11 5.5 13.5 8 11 10.5" />
    </Svg>
  );
}

// A parcel — the Orders nav link and the empty order-history state.
export function PackageIcon() {
  return (
    <Svg>
      <path d="M8 1.75 13.75 5v6L8 14.25 2.25 11V5z" />
      <path d="M2.25 5 8 8.25 13.75 5" />
      <path d="M8 8.25v6" />
    </Svg>
  );
}
