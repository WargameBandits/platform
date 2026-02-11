import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  fetchWriteups,
  upvoteWriteup,
  type Writeup,
} from "../services/writeups";
import MarkdownRenderer from "../components/common/MarkdownRenderer";
import BrutalTabs from "../components/ui/BrutalTabs";
import BrutalCard from "../components/ui/BrutalCard";
import PixelLoader from "../components/common/PixelLoader";

type SortOption = "newest" | "oldest" | "most_upvoted";

const sortTabs = [
  { value: "newest", label: "NEWEST" },
  { value: "oldest", label: "OLDEST" },
  { value: "most_upvoted", label: "TOP" },
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
        prev.map((w) =>
          w.id === id ? { ...w, upvotes: updated.upvotes } : w
        )
      );
    } catch {
      // ignore
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-pixel text-lg text-foreground">
            [KNOWLEDGE_BASE]
          </h1>
          <p className="mt-1 font-retro text-xl text-muted-foreground">
            {total} write-ups published
          </p>
        </div>
        <BrutalTabs
          tabs={sortTabs}
          activeTab={sort}
          onTabChange={(v) => setSort(v as SortOption)}
        />
      </div>

      {loading ? (
        <PixelLoader text="LOADING WRITEUPS" />
      ) : writeups.length === 0 ? (
        <div className="border-2 border-border p-8 text-center">
          <p className="font-retro text-xl text-muted-foreground">
            No write-ups published yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {writeups.map((w) => {
            const isExpanded = expandedId === w.id;
            return (
              <BrutalCard key={w.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link
                      to={`/challenges/${w.challenge_id}`}
                      className="font-retro text-2xl text-foreground hover:text-neon transition-colors"
                    >
                      {w.challenge_title}
                    </Link>
                    <p className="mt-1 font-retro text-base text-muted-foreground">
                      Solution by{" "}
                      <span className="text-primary">{w.username}</span>{" "}
                      &middot;{" "}
                      {new Date(w.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleUpvote(w.id)}
                    className="flex items-center gap-1 border-2 border-border px-3 py-1 font-retro text-base transition-all hover:border-neon hover:text-neon hover:-translate-y-0.5"
                  >
                    ▲ {w.upvotes}
                  </button>
                </div>

                {/* Content */}
                <div
                  className={`mt-4 overflow-hidden ${
                    isExpanded ? "" : "max-h-32"
                  }`}
                >
                  <MarkdownRenderer content={w.content} />
                </div>

                <button
                  onClick={() => toggleExpand(w.id)}
                  className="mt-3 border-2 border-border px-3 py-1 font-retro text-sm text-foreground hover:bg-muted transition-colors"
                >
                  {isExpanded ? "COLLAPSE" : "READ MORE"}
                </button>
              </BrutalCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Writeups;
