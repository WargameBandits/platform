import { useEffect, useState } from "react";
import type { Category, Challenge } from "../types/challenge";
import { fetchChallenges } from "../services/challenges";
import CategoryFilter from "../components/challenge/CategoryFilter";
import ChallengeCard from "../components/challenge/ChallengeCard";

function Challenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadChallenges = async (cursor?: number) => {
    setLoading(true);
    try {
      const res = await fetchChallenges({
        category: category ?? undefined,
        difficulty: difficulty ?? undefined,
        search: search || undefined,
        cursor,
        limit: 20,
      });
      if (cursor) {
        setChallenges((prev) => [...prev, ...res.items]);
      } else {
        setChallenges(res.items);
      }
      setNextCursor(res.next_cursor);
      setTotal(res.total);
    } catch {
      // API 미연결 시 빈 상태 유지
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, [category, difficulty, search]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Challenges
          {total > 0 && (
            <span className="ml-2 text-base font-normal text-muted-foreground">
              ({total})
            </span>
          )}
        </h1>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-48 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="mt-6">
        <CategoryFilter selected={category} onSelect={setCategory} />
      </div>

      <div className="mt-4 flex gap-2">
        {[1, 2, 3, 4, 5].map((d) => (
          <button
            key={d}
            onClick={() => setDifficulty(difficulty === d ? null : d)}
            className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
              difficulty === d
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-accent"
            }`}
          >
            Lv.{d}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading && challenges.length === 0 ? (
          <div className="col-span-full py-10 text-center text-muted-foreground">
            Loading...
          </div>
        ) : challenges.length === 0 ? (
          <div className="col-span-full rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">
            No challenges found.
          </div>
        ) : (
          challenges.map((c) => <ChallengeCard key={c.id} challenge={c} />)
        )}
      </div>

      {nextCursor && (
        <div className="mt-8 text-center">
          <button
            onClick={() => loadChallenges(nextCursor)}
            disabled={loading}
            className="rounded-md border border-border px-6 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}

export default Challenges;
