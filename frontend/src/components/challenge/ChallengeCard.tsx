import { Link } from "react-router-dom";
import type { Challenge } from "../../types/challenge";
import BrutalCard from "../ui/BrutalCard";
import BrutalBadge from "../ui/BrutalBadge";
import { getCategoryColor } from "../../utils/categoryColors";

interface ChallengeCardProps {
  challenge: Challenge;
}

function ChallengeCard({ challenge }: ChallengeCardProps) {
  const catColor = getCategoryColor(challenge.category);

  return (
    <Link
      to={`/challenges/${challenge.id}`}
      className={`group block relative ${challenge.is_solved ? "opacity-60" : ""}`}
    >
      <BrutalCard hover className="p-5">
        {/* Solved Stamp */}
        {challenge.is_solved && (
          <div className="absolute right-3 top-3 stamp-solved">
            <span className="border-2 border-neon px-2 py-1 font-pixel text-[8px] text-neon">
              SOLVED
            </span>
          </div>
        )}

        {/* Category + Points */}
        <div className="flex items-start justify-between">
          <BrutalBadge
            className={`${catColor.bg} ${catColor.text} ${catColor.border}`}
          >
            {challenge.category}
          </BrutalBadge>
          <div className="text-right">
            <span className="font-pixel text-lg text-neon">
              {challenge.points}
            </span>
            <span className="font-retro text-sm text-muted-foreground ml-1">
              PTS
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-3 font-retro text-xl text-foreground group-hover:text-neon transition-colors">
          {challenge.title}
        </h3>

        {/* Difficulty Stars */}
        <div className="mt-2 font-retro text-base text-muted-foreground">
          {"★".repeat(challenge.difficulty)}
          {"☆".repeat(5 - challenge.difficulty)}
        </div>

        {/* Tags */}
        {challenge.tags && challenge.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {challenge.tags.map((tag) => (
              <span
                key={tag}
                className="border border-border/50 bg-muted px-2 py-0.5 font-retro text-xs text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer: Solve count */}
        <div className="mt-3 border-t-2 border-border/30 pt-2">
          <span className="font-retro text-sm text-muted-foreground">
            {challenge.solve_count} SOLVER{challenge.solve_count !== 1 ? "S" : ""}
          </span>
        </div>
      </BrutalCard>
    </Link>
  );
}

export default ChallengeCard;
