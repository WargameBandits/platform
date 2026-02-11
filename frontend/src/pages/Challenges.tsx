import { useEffect, useState } from "react";
import type { Category, Challenge } from "../types/challenge";
import { fetchChallenges } from "../services/challenges";
import ChallengeCard from "../components/challenge/ChallengeCard";
import BrutalTabs from "../components/ui/BrutalTabs";
import BrutalInput from "../components/ui/BrutalInput";
import BrutalButton from "../components/ui/BrutalButton";
import PixelLoader from "../components/common/PixelLoader";

const categoryTabs = [
  { value: "all", label: "ALL" },
  { value: "pwn", label: "PWN" },
  { value: "reversing", label: "REV" },
  { value: "web", label: "WEB" },
  { value: "crypto", label: "CRYPTO" },
  { value: "forensics", label: "FORENSICS" },
  { value: "misc", label: "MISC" },
];

const difficultyTabs = [
  { value: "all", label: "ALL" },
  { value: "1", label: "★" },
  { value: "2", label: "★★" },
  { value: "3", label: "★★★" },
  { value: "4", label: "★★★★" },
  { value: "5", label: "★★★★★" },
];

function Challenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [category, setCategory] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [hideSolved, setHideSolved] = useState(false);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadChallenges = async (cursor?: number) => {
    setLoading(true);
    try {
      const res = await fetchChallenges({
        category:
          category === "all" ? undefined : (category as Category),
        difficulty:
          difficulty === "all" ? undefined : parseInt(difficulty),
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
      // API not connected
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, [category, difficulty, search]);

  const displayedChallenges = hideSolved
    ? challenges.filter((c) => !c.is_solved)
    : challenges;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-pixel text-lg text-foreground">
          [CHALLENGES]
          {total > 0 && (
            <span className="ml-3 font-retro text-xl text-muted-foreground">
              {total} total
            </span>
          )}
        </h1>
        <BrutalInput
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Category Tabs */}
      <BrutalTabs
        tabs={categoryTabs}
        activeTab={category}
        onTabChange={setCategory}
      />

      {/* Difficulty + Hide Solved */}
      <div className="flex items-center gap-4">
        <BrutalTabs
          tabs={difficultyTabs}
          activeTab={difficulty}
          onTabChange={setDifficulty}
        />
        <label className="flex items-center gap-2 border-2 border-border px-3 py-2">
          <input
            type="checkbox"
            checked={hideSolved}
            onChange={(e) => setHideSolved(e.target.checked)}
            className="h-4 w-4 accent-neon"
          />
          <span className="font-retro text-sm text-foreground">
            HIDE SOLVED
          </span>
        </label>
      </div>

      {/* Challenge Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading && challenges.length === 0 ? (
          <div className="col-span-full">
            <PixelLoader text="LOADING CHALLENGES" />
          </div>
        ) : displayedChallenges.length === 0 ? (
          <div className="col-span-full border-2 border-border p-8 text-center">
            <p className="font-retro text-xl text-muted-foreground">
              No challenges found.
            </p>
          </div>
        ) : (
          displayedChallenges.map((c) => (
            <ChallengeCard key={c.id} challenge={c} />
          ))
        )}
      </div>

      {/* Load More */}
      {nextCursor && (
        <div className="text-center">
          <BrutalButton
            onClick={() => loadChallenges(nextCursor)}
            disabled={loading}
            variant="secondary"
          >
            {loading ? "LOADING..." : "LOAD MORE"}
          </BrutalButton>
        </div>
      )}
    </div>
  );
}

export default Challenges;
