import api from "./api";

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  challenge_id: number | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  items: Notification[];
  unread_count: number;
}

export async function fetchNotifications(
  limit = 20,
  unreadOnly = false
): Promise<NotificationListResponse> {
  const { data } = await api.get<NotificationListResponse>("/notifications", {
    params: { limit, unread_only: unreadOnly },
  });
  return data;
}

export async function markAsRead(id: number): Promise<void> {
  await api.put(`/notifications/${id}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await api.put("/notifications/read-all");
}
