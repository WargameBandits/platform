import { cn } from "../../utils/cn";

interface BrutalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  shadow?: "sm" | "md" | "lg" | "neon" | "purple";
  hover?: boolean;
}

const shadowMap = {
  sm: "shadow-brutal-sm dark:shadow-[2px_2px_0px_0px_#00FF41]",
  md: "shadow-brutal dark:shadow-brutal-neon",
  lg: "shadow-brutal-lg dark:shadow-[6px_6px_0px_0px_#00FF41]",
  neon: "shadow-brutal-neon",
  purple: "shadow-brutal-purple",
};

function BrutalCard({
  className,
  shadow = "md",
  hover = false,
  children,
  ...props
}: BrutalCardProps) {
  return (
    <div
      className={cn(
        "border-2 border-border bg-card text-card-foreground",
        shadowMap[shadow],
        hover &&
          "transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg dark:hover:shadow-[6px_6px_0px_0px_#00FF41]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default BrutalCard;
