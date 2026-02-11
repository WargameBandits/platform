export type Category =
  | "pwn"
  | "reversing"
  | "crypto"
  | "web"
  | "forensics"
  | "misc";

export interface Hint {
  cost: number;
  content: string;
}

export interface Challenge {
  id: number;
  title: string;
  description: string;
  category: Category;
  difficulty: number;
  points: number;
  is_dynamic: boolean;
  files: string[] | null;
  hints: Hint[] | null;
  tags: string[] | null;
  solve_count: number;
  is_active: boolean;
  author_id: number | null;
  created_at: string;
  is_solved: boolean;
}

export interface ChallengeListResponse {
  items: Challenge[];
  next_cursor: number | null;
  total: number;
}

export interface SubmissionResult {
  is_correct: boolean;
  message: string;
  points_earned: number;
}
