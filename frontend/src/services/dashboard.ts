import api from "./api";

export interface UserStats {
  rank: number;
  total_score: number;
  solved_count: number;
  main_category: string | null;
  streak_days: number;
}

export interface HeatmapEntry {
  date: string;
  count: number;
}

export interface HeatmapResponse {
  year: number;
  entries: HeatmapEntry[];
}

export interface RecentSolve {
  challenge_id: number;
  challenge_title: string;
  category: string;
  points: number;
  solved_at: string;
}

export interface DashboardData {
  stats: UserStats;
  heatmap: HeatmapResponse;
  recent_activity: RecentSolve[];
  recommended: Array<{
    id: number;
    title: string;
    category: string;
    difficulty: number;
    points: number;
  }>;
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const res = await api.get<DashboardData>("/users/me/dashboard");
  return res.data;
}

export async function fetchUserStats(): Promise<UserStats> {
  const res = await api.get<UserStats>("/users/me/stats");
  return res.data;
}

export async function fetchActivityHeatmap(
  year: number
): Promise<HeatmapResponse> {
  const res = await api.get<HeatmapResponse>("/users/me/heatmap", {
    params: { year },
  });
  return res.data;
}

/**
 * Generate mock dashboard data for development/preview.
 * Replace with real API calls once backend endpoints are ready.
 */
export function getMockDashboardData(): DashboardData {
  const today = new Date();
  const year = today.getFullYear();

  const entries: HeatmapEntry[] = [];
  const startDate = new Date(year, 0, 1);
  const endDate = today;

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const rand = Math.random();
    let count = 0;
    if (rand > 0.7) count = 1;
    if (rand > 0.85) count = 2;
    if (rand > 0.93) count = 3;
    if (rand > 0.97) count = 4;
    entries.push({
      date: d.toISOString().split("T")[0] ?? "",
      count,
    });
  }

  return {
    stats: {
      rank: 42,
      total_score: 4200,
      solved_count: 37,
      main_category: "pwn",
      streak_days: 7,
    },
    heatmap: { year, entries },
    recent_activity: [
      {
        challenge_id: 1,
        challenge_title: "Basic Buffer Overflow",
        category: "pwn",
        points: 100,
        solved_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        challenge_id: 2,
        challenge_title: "SQL Injection 101",
        category: "web",
        points: 150,
        solved_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        challenge_id: 3,
        challenge_title: "Caesar Cipher",
        category: "crypto",
        points: 50,
        solved_at: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        challenge_id: 4,
        challenge_title: "Reverse Me",
        category: "reversing",
        points: 200,
        solved_at: new Date(Date.now() - 259200000).toISOString(),
      },
      {
        challenge_id: 5,
        challenge_title: "Hidden Flag",
        category: "forensics",
        points: 100,
        solved_at: new Date(Date.now() - 345600000).toISOString(),
      },
    ],
    recommended: [
      {
        id: 10,
        title: "Format String Attack",
        category: "pwn",
        difficulty: 2,
        points: 200,
      },
      {
        id: 11,
        title: "XSS Challenge",
        category: "web",
        difficulty: 2,
        points: 150,
      },
      {
        id: 12,
        title: "RSA Basics",
        category: "crypto",
        difficulty: 3,
        points: 300,
      },
    ],
  };
}
