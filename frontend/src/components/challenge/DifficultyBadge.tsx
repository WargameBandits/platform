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

const MAX_STARS = 5;

function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const clamped = Math.max(1, Math.min(MAX_STARS, difficulty));
  const filled = "★".repeat(clamped);
  const empty = "☆".repeat(MAX_STARS - clamped);
  const label = LABELS[difficulty] ?? `Lv.${difficulty}`;

  return (
    <span className="inline-flex items-center gap-1.5 font-retro">
      <span>
        <span className="text-neon">{filled}</span>
        <span className="text-muted-foreground">{empty}</span>
      </span>
      <span className="font-retro text-xs text-muted-foreground">{label}</span>
    </span>
  );
}

export default DifficultyBadge;
