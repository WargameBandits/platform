import api from "./api";
import type {
  Category,
  Challenge,
  ChallengeListResponse,
  SubmissionResult,
} from "../types/challenge";

interface ListParams {
  category?: Category;
  difficulty?: number;
  search?: string;
  cursor?: number;
  limit?: number;
}

export async function fetchChallenges(
  params: ListParams = {}
): Promise<ChallengeListResponse> {
  const { data } = await api.get<ChallengeListResponse>("/challenges", {
    params,
  });
  return data;
}

export async function fetchChallenge(id: number): Promise<Challenge> {
  const { data } = await api.get<Challenge>(`/challenges/${id}`);
  return data;
}

export async function submitFlag(
  challengeId: number,
  flag: string
): Promise<SubmissionResult> {
  const { data } = await api.post<SubmissionResult>(
    `/challenges/${challengeId}/submit`,
    { flag }
  );
  return data;
}
