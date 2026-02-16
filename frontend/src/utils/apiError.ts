import type { AxiosError } from "axios";

interface ApiErrorResponse {
  detail?: string;
}

/**
 * Extracts a user-facing error message from an unknown error.
 * Handles Axios errors with `response.data.detail` and falls back to a default.
 */
export function extractApiError(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const axiosErr = err as AxiosError<ApiErrorResponse>;
    const detail = axiosErr.response?.data?.detail;
    if (typeof detail === "string" && detail.length > 0) {
      return detail;
    }
  }
  return fallback;
}
