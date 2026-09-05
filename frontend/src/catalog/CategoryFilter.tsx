import { useQuery } from "@tanstack/react-query";
import { catalogKeys, fetchCategories } from "./catalogApi";

/*
 * A hairline tab strip, not a row of filled pills.
 *
 * Category navigation sits on one underline: each label rests on the hairline, and
 * the active tab is marked by a heavier rule beneath it in ink — not a filled
 * background, and not the purple accent. Keeping it to a plain rule leaves the
 * filter quiet next to the product rows it controls.
 */
const TAB =
  "focus-ring condensed -mb-px inline-flex items-baseline gap-1.5 border-b-2 px-1 pb-2 text-meta font-semibold tracking-[0.04em] transition";
const SELECTED = "border-ink text-ink";
const UNSELECTED = "border-transparent text-ink-subtle hover:border-edge hover:text-ink-muted";

interface CategoryFilterProps {
  /** Empty string = "All". */
  selectedId: string;
  onSelect: (categoryId: string) => void;
}

export function CategoryFilter({ selectedId, onSelect }: CategoryFilterProps) {
  const query = useQuery({
    queryKey: catalogKeys.categories(),
    queryFn: fetchCategories,
    // Categories change far less often than products, and this list is
    // re-rendered on every page and search change. No reason to refetch it each
    // time the user types.
    staleTime: 5 * 60_000,
  });

  if (query.isPending) {
    return (
      <div className="flex flex-wrap gap-2" aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-6 w-24 animate-pulse rounded bg-skeleton" />
        ))}
      </div>
    );
  }

  // A failed category fetch must not take the product grid down with it — the
  // list still works unfiltered, so this degrades to a note instead of an error
  // screen. If a category filter is somehow already active, the user still
  // needs a way out of it.
  if (query.isError) {
    return (
      <p className="text-meta text-ink-subtle">
        Categories couldn&apos;t be loaded.{" "}
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="font-medium text-ink underline underline-offset-4"
        >
          Retry
        </button>
      </p>
    );
  }

  const categories = query.data;
  const totalProducts = categories.reduce((sum, c) => sum + c._count.products, 0);

  return (
    <div className="flex flex-wrap items-end gap-x-5 gap-y-2 border-b border-hairline">
      <CategoryTab
        label="All"
        count={totalProducts}
        selected={selectedId === ""}
        onClick={() => onSelect("")}
      />
      {categories.map((category) => (
        <CategoryTab
          key={category.id}
          label={category.name}
          count={category._count.products}
          selected={selectedId === category.id}
          onClick={() => onSelect(category.id)}
        />
      ))}
    </div>
  );
}

function CategoryTab({
  label,
  count,
  selected,
  onClick,
}: {
  label: string;
  count: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`${TAB} ${selected ? SELECTED : UNSELECTED}`}
    >
      {label}
      {/* The count is a figure, so it is set as one. */}
      <span className="figures text-rail opacity-70">{count}</span>
    </button>
  );
}
