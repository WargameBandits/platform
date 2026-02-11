import { useMemo, useState } from "react";
import type { HeatmapEntry } from "../../services/dashboard";
import { cn } from "../../utils/cn";

interface HeatmapProps {
  entries: HeatmapEntry[];
  year: number;
}

const DAYS_OF_WEEK = ["Mon", "", "Wed", "", "Fri", "", ""];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function getIntensityClass(count: number): string {
  if (count === 0) return "bg-muted";
  if (count === 1) return "bg-neon/25";
  if (count === 2) return "bg-neon/50";
  if (count === 3) return "bg-neon/75";
  return "bg-neon";
}

function Heatmap({ entries, year }: HeatmapProps) {
  const [tooltip, setTooltip] = useState<{
    date: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  const { weeks, monthLabels } = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach((e) => map.set(e.date, e.count));

    const startDate = new Date(year, 0, 1);
    const startDay = startDate.getDay();
    const adjustedStart = new Date(startDate);
    adjustedStart.setDate(adjustedStart.getDate() - ((startDay + 6) % 7));

    const endDate = new Date(year, 11, 31);
    const weeks: Array<Array<{ date: string; count: number; inYear: boolean }>> =
      [];
    const monthLabels: Array<{ month: string; weekIdx: number }> = [];
    let lastMonth = -1;

    const current = new Date(adjustedStart);
    let weekIdx = 0;

    while (current <= endDate || weeks.length === 0 || (weeks[weeks.length - 1]?.length ?? 0) < 7) {
      if (!weeks[weekIdx]) weeks[weekIdx] = [];

      const dateStr = current.toISOString().split("T")[0] ?? "";
      const inYear = current.getFullYear() === year;
      weeks[weekIdx]!.push({
        date: dateStr,
        count: inYear ? (map.get(dateStr) ?? 0) : 0,
        inYear,
      });

      if (inYear && current.getMonth() !== lastMonth) {
        monthLabels.push({
          month: MONTHS[current.getMonth()] ?? "",
          weekIdx,
        });
        lastMonth = current.getMonth();
      }

      current.setDate(current.getDate() + 1);
      if (weeks[weekIdx]!.length === 7) weekIdx++;

      if (current > endDate && (weeks[weeks.length - 1]?.length ?? 0) === 7)
        break;
    }

    return { weeks, monthLabels };
  }, [entries, year]);

  return (
    <div className="relative">
      {/* Month labels */}
      <div className="flex pl-8 mb-1">
        {monthLabels.map((m, i) => (
          <div
            key={i}
            className="font-retro text-xs text-muted-foreground"
            style={{
              position: "absolute",
              left: `${m.weekIdx * 14 + 32}px`,
            }}
          >
            {m.month}
          </div>
        ))}
      </div>

      <div className="flex gap-0.5 mt-5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1">
          {DAYS_OF_WEEK.map((day, i) => (
            <div
              key={i}
              className="h-[10px] w-6 font-retro text-[9px] leading-[10px] text-muted-foreground text-right pr-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grid */}
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="flex flex-col gap-0.5">
            {week.map((day, dIdx) => (
              <div
                key={dIdx}
                className={cn(
                  "h-[10px] w-[10px] border border-border/20 transition-colors",
                  day.inYear
                    ? getIntensityClass(day.count)
                    : "bg-transparent border-transparent"
                )}
                onMouseEnter={(e) => {
                  if (day.inYear) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip({
                      date: day.date,
                      count: day.count,
                      x: rect.left,
                      y: rect.top - 40,
                    });
                  }
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 pl-8">
        <span className="font-retro text-xs text-muted-foreground">Less</span>
        <div className="h-[10px] w-[10px] border border-border/20 bg-muted" />
        <div className="h-[10px] w-[10px] border border-border/20 bg-neon/25" />
        <div className="h-[10px] w-[10px] border border-border/20 bg-neon/50" />
        <div className="h-[10px] w-[10px] border border-border/20 bg-neon/75" />
        <div className="h-[10px] w-[10px] border border-border/20 bg-neon" />
        <span className="font-retro text-xs text-muted-foreground">More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 border-2 border-border bg-card px-3 py-1.5 shadow-brutal-sm dark:shadow-[2px_2px_0px_0px_#00FF41] pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <p className="font-retro text-sm text-foreground">
            {tooltip.count} solve{tooltip.count !== 1 ? "s" : ""} on{" "}
            {tooltip.date}
          </p>
        </div>
      )}
    </div>
  );
}

export default Heatmap;
