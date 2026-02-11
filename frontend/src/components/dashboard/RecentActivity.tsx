import { Link } from "react-router-dom";
import type { RecentSolve } from "../../services/dashboard";
import BrutalBadge from "../ui/BrutalBadge";

interface RecentActivityProps {
  activities: RecentSolve[];
}

function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <div className="border-2 border-border p-8 text-center">
        <p className="font-retro text-lg text-muted-foreground">
          No activity yet. Start solving challenges!
        </p>
      </div>
    );
  }

  return (
    <div className="border-2 border-border">
      <div className="border-b-2 border-border bg-foreground px-4 py-3">
        <span className="font-retro text-sm uppercase tracking-wider text-background">
          # / Challenge / Category / Points / Time
        </span>
      </div>
      {activities.map((activity, idx) => (
        <Link
          key={`${activity.challenge_id}-${idx}`}
          to={`/challenges/${activity.challenge_id}`}
          className={`flex items-center justify-between px-4 py-3 border-b border-border/30 hover:bg-neon/5 transition-colors ${
            idx % 2 === 1 ? "bg-muted/30" : ""
          }`}
        >
          <div className="flex items-center gap-4">
            <span className="font-retro text-base text-muted-foreground w-6">
              {idx + 1}
            </span>
            <span className="font-retro text-lg text-foreground">
              {activity.challenge_title}
            </span>
            <BrutalBadge variant="muted">
              {activity.category}
            </BrutalBadge>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-pixel text-xs text-neon">
              +{activity.points}
            </span>
            <span className="font-retro text-sm text-muted-foreground">
              {formatTimeAgo(activity.solved_at)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default RecentActivity;
