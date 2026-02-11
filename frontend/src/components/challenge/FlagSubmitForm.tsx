import { useState, type FormEvent } from "react";
import { submitFlag } from "../../services/challenges";
import BrutalInput from "../ui/BrutalInput";
import BrutalButton from "../ui/BrutalButton";
import { achievementToast, errorToast } from "../common/Toast";

interface FlagSubmitFormProps {
  challengeId: number;
  isSolved: boolean;
}

function FlagSubmitForm({ challengeId, isSolved }: FlagSubmitFormProps) {
  const [flag, setFlag] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!flag.trim() || loading) return;

    setLoading(true);
    try {
      const res = await submitFlag(challengeId, flag.trim());
      if (res.is_correct) {
        achievementToast("FLAG ACCEPTED", `+${res.points_earned} PTS`);
        setFlag("");
      } else {
        errorToast("WRONG FLAG", res.message);
      }
    } catch {
      errorToast("SUBMISSION ERROR", "제출 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6">
      {isSolved && (
        <div className="mb-4 border-2 border-neon bg-neon/10 p-3">
          <span className="font-retro text-sm text-neon">
            ALREADY SOLVED
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <BrutalInput
          type="text"
          placeholder="BNDT{...}"
          value={flag}
          onChange={(e) => setFlag(e.target.value)}
          disabled={loading}
          className="flex-1 font-mono text-sm"
        />
        <BrutalButton
          type="submit"
          variant="neon"
          disabled={loading || !flag.trim()}
        >
          {loading ? "..." : "Submit"}
        </BrutalButton>
      </form>
    </div>
  );
}

export default FlagSubmitForm;
