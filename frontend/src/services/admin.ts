import api from "./api";

export interface DashboardStats {
  total_users: number;
  today_signups: number;
  active_instances: number;
  today_submissions: number;
  pending_reviews: number;
  total_challenges: number;
  category_distribution: Record<string, number>;
  daily_submissions: { date: string; count: number }[];
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  total_score: number;
  solved_count: number;
  created_at: string | null;
  last_login: string | null;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>("/admin/stats");
  return data;
}

export async function fetchUsers(
  search?: string,
  limit = 50,
  offset = 0
): Promise<{ items: AdminUser[]; total: number }> {
  const { data } = await api.get("/admin/users", {
    params: { search, limit, offset },
  });
  return data;
}

export async function updateUserRole(
  userId: number,
  role: string
): Promise<void> {
  await api.put(`/admin/users/${userId}/role`, null, { params: { role } });
}

export async function fetchPendingReviews() {
  const { data } = await api.get("/admin/reviews/pending");
  return data;
}

export async function reviewChallenge(
  challengeId: number,
  action: "approve" | "reject",
  comment?: string
) {
  const { data } = await api.post(`/admin/reviews/${challengeId}`, {
    action,
    comment,
  });
  return data;
}
