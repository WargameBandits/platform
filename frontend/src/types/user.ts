export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  solved_count: number;
  total_score: number;
  created_at: string;
  last_login: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
