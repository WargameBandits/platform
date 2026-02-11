import api from "./api";

export interface CommunitySubmission {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  points: number;
  source: string;
  review_status: string;
  review_comment: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface SubmitChallengeData {
  title: string;
  description: string;
  category: string;
  difficulty: number;
  flag: string;
  flag_type?: string;
  is_dynamic?: boolean;
  files?: string[];
  hints?: Array<{ cost: number; content: string }>;
  tags?: string[];
}

export async function submitChallenge(
  data: SubmitChallengeData
): Promise<CommunitySubmission> {
  const { data: result } = await api.post<CommunitySubmission>(
    "/challenges/community/submit",
    data
  );
  return result;
}

export async function fetchMySubmissions(): Promise<CommunitySubmission[]> {
  const { data } = await api.get<CommunitySubmission[]>(
    "/challenges/community/my-submissions"
  );
  return data;
}

export async function updateSubmission(
  challengeId: number,
  data: Partial<SubmitChallengeData>
): Promise<CommunitySubmission> {
  const { data: result } = await api.put<CommunitySubmission>(
    `/challenges/community/${challengeId}`,
    data
  );
  return result;
}

export async function deleteSubmission(challengeId: number): Promise<void> {
  await api.delete(`/challenges/community/${challengeId}`);
}
