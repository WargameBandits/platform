import { useEffect, useState } from "react";
import {
  fetchPendingReviews,
  reviewChallenge,
} from "../../services/admin";
import { getCategoryColor } from "../../utils/categoryColors";
import MarkdownRenderer from "../../components/common/MarkdownRenderer";
import BrutalCard from "../../components/ui/BrutalCard";
import BrutalButton from "../../components/ui/BrutalButton";
import BrutalBadge from "../../components/ui/BrutalBadge";
import PixelLoader from "../../components/common/PixelLoader";
import { errorToast } from "../../components/common/Toast";

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
      errorToast("REVIEW ERROR", "Please provide a rejection reason.");
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
      errorToast("REVIEW ERROR", "Review failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="font-pixel text-lg text-foreground">[CHALLENGE_REVIEW]</h1>
      <p className="mt-1 font-retro text-sm text-muted-foreground">
        {challenges.length} pending submissions
      </p>

      {loading ? (
        <PixelLoader text="LOADING REVIEWS" className="mt-8" />
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Left: List */}
          <div className="space-y-3">
            {challenges.length === 0 ? (
              <div className="border-2 border-border p-8 text-center">
                <p className="font-retro text-sm text-muted-foreground">
                  No pending reviews.
                </p>
              </div>
            ) : (
              challenges.map((c) => {
                const catColor = getCategoryColor(c.category);
                const isSelected = selected?.id === c.id;
                return (
                  <BrutalCard
                    key={c.id}
                    shadow={isSelected ? "purple" : "md"}
                    hover
                    onClick={() => {
                      setSelected(c);
                      setComment("");
                    }}
                    className={`cursor-pointer p-4 ${
                      isSelected
                        ? "border-primary shadow-brutal-purple"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-retro text-base text-foreground">{c.title}</h3>
                      <BrutalBadge
                        variant="default"
                        className={`${catColor.bg} ${catColor.text} ${catColor.border}`}
                      >
                        {c.category}
                      </BrutalBadge>
                    </div>
                    <p className="mt-1 font-retro text-xs text-muted-foreground">
                      Difficulty: {c.difficulty} | Points: {c.points} |{" "}
                      {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </BrutalCard>
                );
              })
            )}
          </div>

          {/* Right: Detail */}
          {selected && (
            <BrutalCard className="p-6">
              <h2 className="font-pixel text-sm text-foreground">
                {selected.title}
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <BrutalBadge
                  variant="default"
                  className={`${getCategoryColor(selected.category).bg} ${getCategoryColor(selected.category).text} ${getCategoryColor(selected.category).border}`}
                >
                  {selected.category}
                </BrutalBadge>
                <span className="font-retro text-xs text-muted-foreground">
                  Difficulty: {selected.difficulty}
                </span>
                <span className="font-retro text-xs text-muted-foreground">
                  Points: {selected.points}
                </span>
              </div>

              {selected.tags && selected.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selected.tags.map((t) => (
                    <span
                      key={t}
                      className="font-retro text-sm text-muted-foreground"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 max-h-60 overflow-y-auto border-2 border-border p-3">
                <MarkdownRenderer content={selected.description} />
              </div>

              {/* Review Actions */}
              <div className="mt-4">
                <label className="font-retro text-sm uppercase text-muted-foreground">
                  Comment (required for reject)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border-2 border-border bg-background px-3 py-2 font-retro text-sm focus:border-neon focus:outline-none"
                  placeholder="Review comment..."
                />
                <div className="mt-3 flex gap-2">
                  <BrutalButton
                    variant="neon"
                    onClick={() => handleReview("approve")}
                    disabled={submitting}
                    className="flex-1"
                  >
                    Approve
                  </BrutalButton>
                  <BrutalButton
                    variant="destructive"
                    onClick={() => handleReview("reject")}
                    disabled={submitting}
                    className="flex-1"
                  >
                    Reject
                  </BrutalButton>
                </div>
              </div>
            </BrutalCard>
          )}
        </div>
      )}
    </div>
  );
}

export default ChallengeReview;
