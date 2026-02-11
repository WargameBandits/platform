import type { Category } from "../../types/challenge";

interface CategoryFilterProps {
  selected: Category | null;
  onSelect: (category: Category | null) => void;
}

const CATEGORIES: { value: Category | null; label: string }[] = [
  { value: null, label: "ALL" },
  { value: "pwn", label: "PWN" },
  { value: "reversing", label: "REVERSING" },
  { value: "crypto", label: "CRYPTO" },
  { value: "web", label: "WEB" },
  { value: "forensics", label: "FORENSICS" },
  { value: "misc", label: "MISC" },
];

function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.label}
          onClick={() => onSelect(cat.value)}
          className={`whitespace-nowrap border-2 border-border px-4 py-2 font-retro text-sm uppercase transition-colors ${
            selected === cat.value
              ? "bg-foreground text-background shadow-brutal-sm"
              : "bg-background hover:bg-accent"
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}

export default CategoryFilter;
