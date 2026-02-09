interface DifficultyBadgeProps {
  difficulty: number;
}

const LABELS: Record<number, string> = {
  1: "Baby",
  2: "Easy",
  3: "Medium",
  4: "Hard",
  5: "Insane",
};

const COLORS: Record<number, string> = {
  1: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  2: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  3: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  4: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  5: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${COLORS[difficulty] ?? COLORS[1]}`}
    >
      {LABELS[difficulty] ?? `Lv.${difficulty}`}
    </span>
  );
}

export default DifficultyBadge;
