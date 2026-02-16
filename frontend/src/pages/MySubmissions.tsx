import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchMySubmissions,
  deleteSubmission,
  type CommunitySubmission,
} from "../services/community";
import BrutalCard from "../components/ui/BrutalCard";
import BrutalButton from "../components/ui/BrutalButton";
import BrutalBadge from "../components/ui/BrutalBadge";
import PixelLoader from "../components/common/PixelLoader";
import { errorToast } from "../components/common/Toast";
import { extractApiError } from "../utils/apiError";

const statusBadgeVariant: Record<string, "neon" | "destructive" | "muted" | "default"> = {
  pending: "muted",
  approved: "neon",
  rejected: "destructive",
  draft: "muted",
};

function MySubmissions() {
  const [submissions, setSubmissions] = useState<CommunitySubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchMySubmissions()
      .then(setSubmissions)
      .catch(() => setSubmissions([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deleteSubmission(id);
      load();
    } catch (err: unknown) {
      errorToast("DELETE FAILED", extractApiError(err, "삭제에 실패했습니다."));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-pixel text-lg text-foreground">[MY_SUBMISSIONS]</h1>
        <Link to="/submit-challenge">
          <BrutalButton variant="neon">
            New Submission
          </BrutalButton>
        </Link>
      </div>

      {loading ? (
        <PixelLoader text="LOADING SUBMISSIONS" className="mt-8" />
      ) : submissions.length === 0 ? (
        <div className="mt-8 border-2 border-border p-8 text-center">
          <p className="font-retro text-sm text-muted-foreground">
            아직 제출한 챌린지가 없습니다.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {submissions.map((sub) => (
            <BrutalCard key={sub.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-retro text-lg text-foreground">{sub.title}</h3>
                  <div className="mt-2 flex items-center gap-2">
                    <BrutalBadge variant="purple">
                      {sub.category}
                    </BrutalBadge>
                    <BrutalBadge variant={statusBadgeVariant[sub.review_status] ?? "default"}>
                      {sub.review_status}
                    </BrutalBadge>
                  </div>
                </div>
                {sub.review_status !== "approved" && (
                  <BrutalButton
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(sub.id)}
                  >
                    Delete
                  </BrutalButton>
                )}
              </div>
              {sub.review_comment && (
                <div className="mt-3 border-l-2 border-neon bg-neon/5 py-2 pl-3">
                  <p className="font-retro text-sm text-muted-foreground">
                    Review: {sub.review_comment}
                  </p>
                </div>
              )}
              <p className="mt-2 font-retro text-xs text-muted-foreground">
                Submitted: {new Date(sub.created_at).toLocaleString()}
              </p>
            </BrutalCard>
          ))}
        </div>
      )}
    </div>
  );
}

export default MySubmissions;
