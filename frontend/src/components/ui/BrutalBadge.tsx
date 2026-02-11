import { cn } from "../../utils/cn";

interface BrutalBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "neon" | "purple" | "destructive" | "muted";
}

const variantStyles = {
  default: "bg-background text-foreground border-border",
  neon: "bg-neon/20 text-neon border-neon dark:bg-neon/10",
  purple: "bg-primary/20 text-primary border-primary dark:bg-primary/10",
  destructive: "bg-destructive/20 text-destructive border-destructive",
  muted: "bg-muted text-muted-foreground border-muted-foreground/30",
};

function BrutalBadge({
  className,
  variant = "default",
  children,
  ...props
}: BrutalBadgeProps) {
  return (
    <span
      className={cn(
        "inline-block border-2 px-2 py-0.5 font-retro text-sm uppercase",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export default BrutalBadge;
