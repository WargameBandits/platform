import { cn } from "../../utils/cn";

interface BrutalTableProps {
  headers: string[];
  rows: React.ReactNode[][];
  zebra?: boolean;
  className?: string;
}

function BrutalTable({
  headers,
  rows,
  zebra = true,
  className,
}: BrutalTableProps) {
  return (
    <div
      className={cn("border-2 border-border overflow-x-auto", className)}
    >
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-border bg-foreground text-background">
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-left font-retro text-sm uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={cn(
                "border-b border-border/30 transition-colors hover:bg-neon/5",
                zebra && rowIdx % 2 === 1 && "bg-muted/50"
              )}
            >
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className="px-4 py-3 font-retro text-base"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BrutalTable;
