import { useQuery } from "@tanstack/react-query";
import { catalogKeys, fetchCategories } from "./catalogApi";

const PILL =
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-slate-300";
const SELECTED = "border-slate-900 bg-slate-900 text-white";
const UNSELECTED = "border-slate-300 bg-white text-slate-700 hover:bg-slate-100";

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
          <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-slate-100" />
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
      <p className="text-sm text-slate-500">
        Categories couldn&apos;t be loaded.{" "}
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="font-medium text-slate-900 underline underline-offset-4"
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
      <CategoryPill
        label="All"
        count={totalProducts}
        selected={selectedId === ""}
        onClick={() => onSelect("")}
      />
      {categories.map((category) => (
        <CategoryPill
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

function CategoryPill({
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
      className={`${PILL} ${selected ? SELECTED : UNSELECTED}`}
    >
      {label}
      <span className={selected ? "text-slate-300" : "text-slate-400"}>{count}</span>
    </button>
  );
}
