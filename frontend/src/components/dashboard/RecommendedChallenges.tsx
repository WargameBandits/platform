import { Link } from "react-router-dom";
import BrutalCard from "../ui/BrutalCard";
import BrutalBadge from "../ui/BrutalBadge";

interface RecommendedChallenge {
  id: number;
  title: string;
  category: string;
  difficulty: number;
  points: number;
}

interface RecommendedChallengesProps {
  challenges: RecommendedChallenge[];
}

function RecommendedChallenges({ challenges }: RecommendedChallengesProps) {
  if (challenges.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {challenges.map((challenge) => (
        <Link key={challenge.id} to={`/challenges/${challenge.id}`}>
          <BrutalCard hover className="p-4">
            <div className="flex items-start justify-between">
              <BrutalBadge variant="muted">{challenge.category}</BrutalBadge>
              <span className="font-pixel text-xs text-neon">
                {challenge.points} PTS
              </span>
            </div>
            <h3 className="mt-3 font-retro text-xl text-foreground">
              {challenge.title}
            </h3>
            <div className="mt-2 font-retro text-base text-muted-foreground">
              {"★".repeat(challenge.difficulty)}
              {"☆".repeat(5 - challenge.difficulty)}
            </div>
          </BrutalCard>
        </Link>
      ))}
    </div>
  );
}

export default RecommendedChallenges;
