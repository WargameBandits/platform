import { useState, type FormEvent } from "react";
import { submitFlag } from "../../services/challenges";
import type { SubmissionResult } from "../../types/challenge";

interface FlagSubmitFormProps {
  challengeId: number;
  isSolved: boolean;
}

function FlagSubmitForm({ challengeId, isSolved }: FlagSubmitFormProps) {
  const [flag, setFlag] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!flag.trim() || loading) return;

    setLoading(true);
    setResult(null);
    try {
      const res = await submitFlag(challengeId, flag.trim());
      setResult(res);
      if (res.is_correct) {
        setFlag("");
      }
    } catch {
      setResult({
        is_correct: false,
        message: "제출 중 오류가 발생했습니다.",
        points_earned: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6">
      {isSolved && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
          이미 풀이한 문제입니다.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="BNDT{...}"
          value={flag}
          onChange={(e) => setFlag(e.target.value)}
          disabled={loading}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
        />
        <button
          type="submit"
          disabled={loading || !flag.trim()}
          className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "..." : "Submit"}
        </button>
      </form>

      {result && (
        <div
          className={`mt-3 rounded-md p-3 text-sm ${
            result.is_correct
              ? "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300"
              : "bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300"
          }`}
        >
          {result.message}
          {result.is_correct && result.points_earned > 0 && (
            <span className="ml-2 font-bold">+{result.points_earned} pts</span>
          )}
        </div>
      )}
    </div>
  );
}

export default FlagSubmitForm;
