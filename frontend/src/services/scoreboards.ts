import api from "./api";

export interface ScoreboardEntry {
  rank: number;
  user_id: number;
  username: string;
  solved_count: number;
  total_score: number;
}

export interface ScoreboardResponse {
  category: string | null;
  entries: ScoreboardEntry[];
}

export async function fetchScoreboard(
  category?: string
): Promise<ScoreboardResponse> {
  const params = category ? { category } : {};
  const { data } = await api.get<ScoreboardResponse>("/scoreboards", { params });
  return data;
}
