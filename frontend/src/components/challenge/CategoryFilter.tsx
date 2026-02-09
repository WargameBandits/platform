import type { Category } from "../../types/challenge";

interface CategoryFilterProps {
  selected: Category | null;
  onSelect: (category: Category | null) => void;
}

const CATEGORIES: { value: Category | null; label: string }[] = [
  { value: null, label: "All" },
  { value: "pwn", label: "Pwn" },
  { value: "reversing", label: "Reversing" },
  { value: "crypto", label: "Crypto" },
  { value: "web", label: "Web" },
  { value: "forensics", label: "Forensics" },
  { value: "misc", label: "Misc" },
];

function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.label}
          onClick={() => onSelect(cat.value)}
          className={`whitespace-nowrap rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
            selected === cat.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:bg-accent"
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}

export default CategoryFilter;
