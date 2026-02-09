import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchMySubmissions,
  deleteSubmission,
  type CommunitySubmission,
} from "../services/community";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500",
  approved: "bg-green-500/10 text-green-500",
  rejected: "bg-red-500/10 text-red-500",
  draft: "bg-gray-500/10 text-gray-500",
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
    } catch (err: any) {
      alert(err.response?.data?.detail ?? "삭제에 실패했습니다.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Submissions</h1>
        <Link
          to="/submit-challenge"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New Submission
        </Link>
      </div>

      {loading ? (
        <p className="mt-8 text-center text-muted-foreground">Loading...</p>
      ) : submissions.length === 0 ? (
        <p className="mt-8 text-center text-muted-foreground">
          아직 제출한 챌린지가 없습니다.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{sub.title}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded bg-secondary px-2 py-0.5 text-xs uppercase text-secondary-foreground">
                      {sub.category}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        statusColors[sub.review_status] ?? ""
                      }`}
                    >
                      {sub.review_status}
                    </span>
                  </div>
                </div>
                {sub.review_status !== "approved" && (
                  <button
                    onClick={() => handleDelete(sub.id)}
                    className="text-sm text-destructive hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
              {sub.review_comment && (
                <p className="mt-3 rounded-md bg-muted p-3 text-sm text-muted-foreground">
                  Review: {sub.review_comment}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Submitted: {new Date(sub.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MySubmissions;
