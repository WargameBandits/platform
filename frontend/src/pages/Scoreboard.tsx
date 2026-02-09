import { useEffect, useState } from "react";
import {
  fetchScoreboard,
  type ScoreboardEntry,
} from "../services/scoreboards";

const categories = [
  { value: "", label: "All" },
  { value: "pwn", label: "Pwn" },
  { value: "reversing", label: "Reversing" },
  { value: "crypto", label: "Crypto" },
  { value: "web", label: "Web" },
  { value: "forensics", label: "Forensics" },
  { value: "misc", label: "Misc" },
];

function Scoreboard() {
  const [entries, setEntries] = useState<ScoreboardEntry[]>([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchScoreboard(category || undefined)
      .then((res) => setEntries(res.entries))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Scoreboard</h1>

      {/* Category tabs */}
      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              category === cat.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Rank
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Username
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                Score
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                Solved
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Loading...
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No rankings yet.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr
                  key={entry.user_id}
                  className="border-b border-border last:border-b-0 hover:bg-card/50"
                >
                  <td className="px-4 py-3">
                    <span
                      className={`font-mono font-bold ${
                        entry.rank <= 3 ? "text-primary" : ""
                      }`}
                    >
                      #{entry.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{entry.username}</td>
                  <td className="px-4 py-3 text-right font-mono text-primary">
                    {entry.total_score}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {entry.solved_count}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Scoreboard;
