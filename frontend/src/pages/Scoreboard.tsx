import { useEffect, useState } from "react";
import {
  fetchScoreboard,
  type ScoreboardEntry,
} from "../services/scoreboards";
import BrutalTabs from "../components/ui/BrutalTabs";
import BrutalCard from "../components/ui/BrutalCard";
import PixelLoader from "../components/common/PixelLoader";
import useAuthStore from "../stores/authStore";

const categoryTabs = [
  { value: "", label: "ALL" },
  { value: "pwn", label: "PWN" },
  { value: "reversing", label: "REV" },
  { value: "crypto", label: "CRYPTO" },
  { value: "web", label: "WEB" },
  { value: "forensics", label: "FORENSICS" },
  { value: "misc", label: "MISC" },
];

function Scoreboard() {
  const [entries, setEntries] = useState<ScoreboardEntry[]>([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    setLoading(true);
    fetchScoreboard(category || undefined)
      .then((res) => setEntries(res.entries))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [category]);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const myEntry = user
    ? entries.find((e) => e.username === user.username)
    : null;

  return (
    <div className="space-y-6">
      <h1 className="font-pixel text-lg text-foreground">[SCOREBOARD]</h1>

      <BrutalTabs
        tabs={categoryTabs}
        activeTab={category}
        onTabChange={setCategory}
      />

      {loading ? (
        <PixelLoader text="LOADING RANKINGS" />
      ) : entries.length === 0 ? (
        <div className="border-2 border-border p-8 text-center">
          <p className="font-retro text-xl text-muted-foreground">
            No rankings yet.
          </p>
        </div>
      ) : (
        <>
          {/* Podium - Top 3 */}
          {top3.length > 0 && (
            <div className="flex items-end justify-center gap-4">
              {/* 2nd Place */}
              {top3[1] && (
                <BrutalCard className="w-40 p-4 text-center" shadow="sm">
                  <div className="font-pixel text-sm text-muted-foreground">
                    #2
                  </div>
                  <div className="mt-2 font-retro text-xl text-foreground">
                    {top3[1].username}
                  </div>
                  <div className="mt-1 font-pixel text-base text-primary">
                    {top3[1].total_score}
                  </div>
                  <div className="font-retro text-sm text-muted-foreground">
                    {top3[1].solved_count} solved
                  </div>
                </BrutalCard>
              )}

              {/* 1st Place */}
              {top3[0] && (
                <BrutalCard
                  className="w-48 p-5 text-center border-neon"
                  shadow="neon"
                >
                  <div className="font-pixel text-base text-neon">
                    ♛ #1
                  </div>
                  <div className="mt-2 font-retro text-2xl text-foreground">
                    {top3[0].username}
                  </div>
                  <div className="mt-1 font-pixel text-xl text-neon">
                    {top3[0].total_score}
                  </div>
                  <div className="font-retro text-sm text-muted-foreground">
                    {top3[0].solved_count} solved
                  </div>
                </BrutalCard>
              )}

              {/* 3rd Place */}
              {top3[2] && (
                <BrutalCard className="w-40 p-4 text-center" shadow="sm">
                  <div className="font-pixel text-sm text-muted-foreground">
                    #3
                  </div>
                  <div className="mt-2 font-retro text-xl text-foreground">
                    {top3[2].username}
                  </div>
                  <div className="mt-1 font-pixel text-base text-primary">
                    {top3[2].total_score}
                  </div>
                  <div className="font-retro text-sm text-muted-foreground">
                    {top3[2].solved_count} solved
                  </div>
                </BrutalCard>
              )}
            </div>
          )}

          {/* Rankings Table */}
          {rest.length > 0 && (
            <div className="border-2 border-border">
              <div className="border-b-2 border-border bg-foreground">
                <div className="grid grid-cols-[60px_1fr_120px_100px] px-4 py-3">
                  <span className="font-retro text-sm uppercase text-background">
                    #
                  </span>
                  <span className="font-retro text-sm uppercase text-background">
                    HACKER
                  </span>
                  <span className="font-retro text-sm uppercase text-background text-right">
                    SCORE
                  </span>
                  <span className="font-retro text-sm uppercase text-background text-right">
                    SOLVED
                  </span>
                </div>
              </div>
              {rest.map((entry, idx) => (
                <div
                  key={entry.user_id}
                  className={`grid grid-cols-[60px_1fr_120px_100px] px-4 py-3 border-b border-border/30 hover:bg-neon/5 transition-colors ${
                    idx % 2 === 1 ? "bg-muted/30" : ""
                  }`}
                >
                  <span className="font-retro text-base text-muted-foreground">
                    {entry.rank}
                  </span>
                  <span className="font-retro text-lg text-foreground">
                    {entry.username}
                  </span>
                  <span className="font-pixel text-xs text-neon text-right">
                    {entry.total_score}
                  </span>
                  <span className="font-retro text-base text-muted-foreground text-right">
                    {entry.solved_count}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Sticky My Rank Bar */}
          {myEntry && (
            <div className="sticky bottom-0 border-2 border-neon bg-card px-6 py-3 shadow-brutal-neon">
              <div className="flex items-center justify-between">
                <span className="font-pixel text-xs text-neon">
                  YOUR RANK: #{myEntry.rank}
                </span>
                <span className="font-pixel text-xs text-foreground">
                  SCORE: {myEntry.total_score}
                </span>
                <span className="font-retro text-base text-muted-foreground">
                  {myEntry.solved_count} solved
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Scoreboard;
