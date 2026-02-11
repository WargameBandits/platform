import { useEffect, useState } from "react";
import useAuthStore from "../stores/authStore";
import {
  type DashboardData,
  fetchDashboardData,
  getMockDashboardData,
} from "../services/dashboard";
import MetricsCard from "../components/dashboard/MetricsCard";
import Heatmap from "../components/dashboard/Heatmap";
import RecentActivity from "../components/dashboard/RecentActivity";
import RecommendedChallenges from "../components/dashboard/RecommendedChallenges";
import PixelLoader from "../components/common/PixelLoader";

function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchDashboardData()
      .then(setData)
      .catch(() => {
        // Fallback to mock data if API not ready
        setData(getMockDashboardData());
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <PixelLoader text="LOADING DASHBOARD" />;
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-pixel text-lg text-foreground">
          WELCOME BACK, {user?.username.toUpperCase()}
          <span className="text-neon animate-blink">_</span>
        </h1>
        <p className="mt-2 font-retro text-xl text-muted-foreground">
          Here's your progress report, soldier.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          label="Current Rank"
          value={`#${data.stats.rank}`}
          accent="purple"
        />
        <MetricsCard
          label="Total Score"
          value={`${data.stats.total_score.toLocaleString()} PTS`}
          accent="neon"
        />
        <MetricsCard
          label="Main Category"
          value={
            data.stats.main_category
              ? data.stats.main_category.toUpperCase()
              : "N/A"
          }
        />
        <MetricsCard
          label="Current Streak"
          value={`${data.stats.streak_days} DAYS`}
          accent="neon"
        />
      </div>

      {/* Heatmap */}
      <div>
        <h2 className="font-pixel text-sm text-foreground mb-4">
          [ACTIVITY_LOG]
        </h2>
        <div className="border-2 border-border p-4 shadow-brutal dark:shadow-brutal-neon overflow-x-auto">
          <Heatmap
            entries={data.heatmap.entries}
            year={data.heatmap.year}
          />
        </div>
      </div>

      {/* Recommended Challenges */}
      <div>
        <h2 className="font-pixel text-sm text-foreground mb-4">
          [RECOMMENDED]
        </h2>
        <RecommendedChallenges challenges={data.recommended} />
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="font-pixel text-sm text-foreground mb-4">
          [RECENT_SOLVES]
        </h2>
        <RecentActivity activities={data.recent_activity} />
      </div>
    </div>
  );
}

export default Dashboard;
