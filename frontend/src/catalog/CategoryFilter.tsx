import { useQuery } from "@tanstack/react-query";
import { catalogKeys, fetchCategories } from "./catalogApi";

/*
 * A row of filled pills, matching the reference: rounded-full chips, the active
 * one filled with the brand purple, the rest a hairline outline on white. Each
 * carries its product count as a faint tabular figure.
 */
const TAB =
  "focus-ring inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-meta font-medium transition-colors";
const SELECTED = "border-brand bg-brand text-brand-foreground";
const UNSELECTED =
  "border-hairline bg-surface text-ink-subtle hover:border-edge hover:text-ink";

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
    <div className="flex flex-wrap gap-2">
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
      <span
        className={`text-xs tabular-nums ${selected ? "text-brand-foreground/80" : "text-ink-faint"}`}
      >
        {count}
      </span>
    </button>
  );
}
