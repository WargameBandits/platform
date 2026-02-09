import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDashboardStats, type DashboardStats } from "../../services/admin";
import { getCategoryColor } from "../../utils/categoryColors";

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
    return (
      <div className="py-20 text-center text-muted-foreground">Loading...</div>
    );
  }

  if (!stats) {
    return (
      <div className="py-20 text-center text-destructive">
        Failed to load dashboard stats.
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats.total_users, color: "text-blue-400" },
    { label: "Today Signups", value: stats.today_signups, color: "text-green-400" },
    { label: "Active Instances", value: stats.active_instances, color: "text-orange-400" },
    { label: "Today Submissions", value: stats.today_submissions, color: "text-purple-400" },
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
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Link
            to="/admin/reviews"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Review Queue
            {stats.pending_reviews > 0 && (
              <span className="ml-2 rounded-full bg-yellow-500 px-1.5 text-xs text-black">
                {stats.pending_reviews}
              </span>
            )}
          </Link>
          <Link
            to="/admin/users"
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent/10"
          >
            Users
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-border bg-card p-4"
          >
            <p className="text-xs uppercase text-muted-foreground">
              {card.label}
            </p>
            <p className={`mt-1 text-2xl font-bold ${card.color}`}>
              {card.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Daily Submissions Bar Chart */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium">Submissions (7 days)</h3>
          <div className="mt-4 flex items-end gap-2" style={{ height: 120 }}>
            {stats.daily_submissions.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground">
                  {d.count}
                </span>
                <div
                  className="w-full rounded-t bg-primary/70"
                  style={{
                    height: `${Math.max((d.count / maxDaily) * 80, 2)}px`,
                  }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {d.date}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium">Solves by Category</h3>
          <div className="mt-4 space-y-3">
            {Object.entries(stats.category_distribution).length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet</p>
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
                      <div className="flex items-center justify-between text-sm">
                        <span className={`font-medium uppercase ${color.text}`}>
                          {cat}
                        </span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${color.bg} border ${color.border}`}
                          style={{ width: `${pct}%`, minWidth: "4px" }}
                        />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
