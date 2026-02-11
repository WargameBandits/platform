import api from "./api";
import type { User } from "../types/user";

export interface UserPublic {
  id: number;
  username: string;
  role: string;
  solved_count: number;
  total_score: number;
  created_at: string;
}

export async function fetchUserProfile(userId: number): Promise<UserPublic> {
  const { data } = await api.get<UserPublic>(`/users/${userId}`);
  return data;
}

export async function fetchMyProfile(): Promise<User> {
  const { data } = await api.get<User>("/users/me");
  return data;
}
