import BrutalCard from "../ui/BrutalCard";
import { cn } from "../../utils/cn";

interface MetricsCardProps {
  label: string;
  value: string | number;
  accent?: "neon" | "purple" | "default";
  className?: string;
}

const accentStyles = {
  neon: "text-neon",
  purple: "text-primary",
  default: "text-foreground",
};

function MetricsCard({
  label,
  value,
  accent = "default",
  className,
}: MetricsCardProps) {
  return (
    <BrutalCard hover className={cn("p-5", className)}>
      <p className="font-retro text-base uppercase text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-pixel text-2xl",
          accentStyles[accent]
        )}
      >
        {value}
      </p>
    </BrutalCard>
  );
}

export default MetricsCard;
