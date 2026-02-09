import { useEffect, useState } from "react";
import {
  fetchPendingReviews,
  reviewChallenge,
} from "../../services/admin";
import { getCategoryColor } from "../../utils/categoryColors";
import MarkdownRenderer from "../../components/common/MarkdownRenderer";

interface PendingChallenge {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  points: number;
  tags: string[] | null;
  source: string;
  review_status: string;
  review_comment: string | null;
  reviewed_at: string | null;
  created_at: string;
}

function ChallengeReview() {
  const [challenges, setChallenges] = useState<PendingChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PendingChallenge | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadPending = () => {
    setLoading(true);
    fetchPendingReviews()
      .then(setChallenges)
      .catch(() => setChallenges([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleReview = async (action: "approve" | "reject") => {
    if (!selected) return;
    if (action === "reject" && !comment.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    setSubmitting(true);
    try {
      await reviewChallenge(
        selected.id,
        action,
        comment.trim() || undefined
      );
      setSelected(null);
      setComment("");
      loadPending();
    } catch {
      alert("Review failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Challenge Review</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {challenges.length} pending submissions
      </p>

      {loading ? (
        <p className="mt-8 text-center text-muted-foreground">Loading...</p>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Left: List */}
          <div className="space-y-3">
            {challenges.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pending reviews.
              </p>
            ) : (
              challenges.map((c) => {
                const catColor = getCategoryColor(c.category);
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelected(c);
                      setComment("");
                    }}
                    className={`block w-full rounded-lg border p-4 text-left transition-colors ${
                      selected?.id === c.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{c.title}</h3>
                      <span
                        className={`rounded border px-1.5 py-0.5 text-xs uppercase ${catColor.bg} ${catColor.text} ${catColor.border}`}
                      >
                        {c.category}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Difficulty: {c.difficulty} | Points: {c.points} |{" "}
                      {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </button>
                );
              })
            )}
          </div>

          {/* Right: Detail */}
          {selected && (
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-bold">{selected.title}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <span
                  className={`rounded border px-1.5 py-0.5 text-xs uppercase ${getCategoryColor(selected.category).bg} ${getCategoryColor(selected.category).text} ${getCategoryColor(selected.category).border}`}
                >
                  {selected.category}
                </span>
                <span className="text-xs text-muted-foreground">
                  Difficulty: {selected.difficulty}
                </span>
                <span className="text-xs text-muted-foreground">
                  Points: {selected.points}
                </span>
              </div>

              {selected.tags && selected.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selected.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 max-h-60 overflow-y-auto rounded border border-border p-3">
                <MarkdownRenderer content={selected.description} />
              </div>

              {/* Review Actions */}
              <div className="mt-4">
                <label className="text-sm font-medium">
                  Comment (required for reject)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Review comment..."
                />
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleReview("approve")}
                    disabled={submitting}
                    className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReview("reject")}
                    disabled={submitting}
                    className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ChallengeReview;
