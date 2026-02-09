import api from "./api";

export interface Writeup {
  id: number;
  user_id: number;
  username: string;
  challenge_id: number;
  challenge_title: string;
  content: string;
  is_public: boolean;
  upvotes: number;
  created_at: string;
  updated_at: string;
}

export interface WriteupListResponse {
  items: Writeup[];
  total: number;
}

export async function fetchWriteups(
  challengeId?: number,
  sort: "newest" | "oldest" | "most_upvoted" = "newest",
  limit = 20,
  offset = 0
): Promise<WriteupListResponse> {
  const params: Record<string, string | number> = { sort, limit, offset };
  if (challengeId) params.challenge_id = challengeId;
  const { data } = await api.get<WriteupListResponse>("/writeups", { params });
  return data;
}

export async function fetchWriteup(writeupId: number): Promise<Writeup> {
  const { data } = await api.get<Writeup>(`/writeups/${writeupId}`);
  return data;
}

export async function createWriteup(
  challengeId: number,
  content: string,
  isPublic = true
): Promise<Writeup> {
  const { data } = await api.post<Writeup>("/writeups", {
    challenge_id: challengeId,
    content,
    is_public: isPublic,
  });
  return data;
}

export async function upvoteWriteup(writeupId: number): Promise<Writeup> {
  const { data } = await api.post<Writeup>(`/writeups/${writeupId}/upvote`);
  return data;
}
