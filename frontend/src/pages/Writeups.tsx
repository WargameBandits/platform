import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { fetchWriteups, upvoteWriteup, type Writeup } from "../services/writeups";
import MarkdownRenderer from "../components/common/MarkdownRenderer";


type SortOption = "newest" | "oldest" | "most_upvoted";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "most_upvoted", label: "Most Upvoted" },
];

function Writeups() {
  const [writeups, setWriteups] = useState<Writeup[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>("newest");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const loadWriteups = useCallback(() => {
    setLoading(true);
    fetchWriteups(undefined, sort)
      .then((res) => {
        setWriteups(res.items);
        setTotal(res.total);
      })
      .catch(() => setWriteups([]))
      .finally(() => setLoading(false));
  }, [sort]);

  useEffect(() => {
    loadWriteups();
  }, [loadWriteups]);

  const handleUpvote = async (id: number) => {
    try {
      const updated = await upvoteWriteup(id);
      setWriteups((prev) =>
        prev.map((w) => (w.id === id ? { ...w, upvotes: updated.upvotes } : w))
      );
    } catch {
      // ignore
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Write-ups</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} write-ups published
          </p>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sort by:</span>
          <div className="flex rounded-md border border-input">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  sort === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <p className="mt-8 text-center text-muted-foreground">Loading...</p>
      ) : writeups.length === 0 ? (
        <p className="mt-8 text-center text-muted-foreground">
          아직 작성된 Write-up이 없습니다.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {writeups.map((w) => {
            const isExpanded = expandedId === w.id;
            // Extract category from challenge_title pattern or default
            return (
              <div
                key={w.id}
                className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-border/80"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">
                      <Link
                        to={`/challenges/${w.challenge_id}`}
                        className="text-primary hover:underline"
                      >
                        {w.challenge_title}
                      </Link>
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      by {w.username} &middot;{" "}
                      {new Date(w.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpvote(w.id)}
                      className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-sm transition-colors hover:border-primary hover:text-primary"
                    >
                      ▲ {w.upvotes}
                    </button>
                  </div>
                </div>

                {/* Content - collapsible */}
                <div
                  className={`mt-3 overflow-hidden ${
                    isExpanded ? "" : "line-clamp-4"
                  }`}
                >
                  <MarkdownRenderer content={w.content} />
                </div>

                <button
                  onClick={() => toggleExpand(w.id)}
                  className="mt-2 text-xs text-primary hover:underline"
                >
                  {isExpanded ? "Collapse" : "Read more"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Writeups;
