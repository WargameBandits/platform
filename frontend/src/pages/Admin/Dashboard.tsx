import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDashboardStats, type DashboardStats } from "../../services/admin";
import { getCategoryColor } from "../../utils/categoryColors";
import BrutalCard from "../../components/ui/BrutalCard";
import BrutalButton from "../../components/ui/BrutalButton";
import BrutalBadge from "../../components/ui/BrutalBadge";
import PixelLoader from "../../components/common/PixelLoader";

function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <PixelLoader text="LOADING DASHBOARD" className="py-20" />;
  }

  if (!stats) {
    return (
      <div className="py-20 text-center">
        <p className="font-retro text-lg text-destructive">
          Failed to load dashboard stats.
        </p>
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats.total_users, color: "text-blue-400" },
    { label: "Today Signups", value: stats.today_signups, color: "text-neon" },
    { label: "Active Instances", value: stats.active_instances, color: "text-orange-400" },
    { label: "Today Submissions", value: stats.today_submissions, color: "text-primary" },
    { label: "Total Challenges", value: stats.total_challenges, color: "text-cyan-400" },
    {
      label: "Pending Reviews",
      value: stats.pending_reviews,
      color: stats.pending_reviews > 0 ? "text-yellow-400" : "text-muted-foreground",
    },
  ];

  const maxDaily = Math.max(...stats.daily_submissions.map((d) => d.count), 1);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-pixel text-lg text-foreground">[ADMIN_PANEL]</h1>
        <div className="flex gap-2">
          <Link to="/admin/reviews">
            <BrutalButton variant="primary">
              Review Queue
              {stats.pending_reviews > 0 && (
                <BrutalBadge variant="destructive" className="ml-2 text-xs">
                  {stats.pending_reviews}
                </BrutalBadge>
              )}
            </BrutalButton>
          </Link>
          <Link to="/admin/users">
            <BrutalButton variant="secondary">
              Users
            </BrutalButton>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {statCards.map((card) => (
          <BrutalCard key={card.label} className="p-4">
            <p className="font-retro text-xs uppercase text-muted-foreground">
              {card.label}
            </p>
            <p className={`mt-1 font-pixel text-xl ${card.color}`}>
              {card.value.toLocaleString()}
            </p>
          </BrutalCard>
        ))}
      </div>

      {/* Charts Row */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Daily Submissions Bar Chart */}
        <BrutalCard className="p-4">
          <h3 className="font-retro text-sm uppercase text-muted-foreground">
            Submissions (7 days)
          </h3>
          <div className="mt-4 flex items-end gap-2" style={{ height: 120 }}>
            {stats.daily_submissions.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <span className="font-retro text-[10px] text-muted-foreground">
                  {d.count}
                </span>
                <div
                  className="w-full bg-neon"
                  style={{
                    height: `${Math.max((d.count / maxDaily) * 80, 2)}px`,
                  }}
                />
                <span className="font-retro text-[10px] text-muted-foreground">
                  {d.date}
                </span>
              </div>
            ))}
          </div>
        </BrutalCard>

        {/* Category Distribution */}
        <BrutalCard className="p-4">
          <h3 className="font-retro text-sm uppercase text-muted-foreground">
            Solves by Category
          </h3>
          <div className="mt-4 space-y-3">
            {Object.entries(stats.category_distribution).length === 0 ? (
              <p className="font-retro text-sm text-muted-foreground">No data yet</p>
            ) : (
              Object.entries(stats.category_distribution)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, count]) => {
                  const color = getCategoryColor(cat);
                  const total = Object.values(
                    stats.category_distribution
                  ).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between">
                        <span className={`font-retro text-sm uppercase ${color.text}`}>
                          {cat}
                        </span>
                        <span className="font-retro text-sm text-muted-foreground">
                          {count}
                        </span>
                      </div>
                      <div className="mt-1 h-2 border-2 border-border bg-muted">
                        <div
                          className={`h-full ${color.bg}`}
                          style={{ width: `${pct}%`, minWidth: "4px" }}
                        />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </BrutalCard>
      </div>
    </div>
  );
}

export default Dashboard;
