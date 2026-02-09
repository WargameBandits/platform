import { Link } from "react-router-dom";
import type { Challenge } from "../../types/challenge";
import DifficultyBadge from "./DifficultyBadge";
import { getCategoryColor } from "../../utils/categoryColors";

interface ChallengeCardProps {
  challenge: Challenge;
}

function ChallengeCard({ challenge }: ChallengeCardProps) {
  const catColor = getCategoryColor(challenge.category);

  return (
    <Link
      to={`/challenges/${challenge.id}`}
      className="group block rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/50"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold group-hover:text-primary">
              {challenge.title}
            </h3>
            {challenge.is_solved && (
              <span className="text-green-500" title="Solved">
                &#10003;
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded border px-2 py-0.5 text-xs font-medium uppercase ${catColor.bg} ${catColor.text} ${catColor.border}`}
            >
              {challenge.category}
            </span>
            <DifficultyBadge difficulty={challenge.difficulty} />
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-primary">
            {challenge.points}
            <span className="text-xs font-normal text-muted-foreground">
              {" "}
              pts
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {challenge.solve_count} solves
          </div>
        </div>
      </div>

      {challenge.tags && challenge.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {challenge.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

export default ChallengeCard;
