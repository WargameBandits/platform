import { cn } from "../../utils/cn";

interface BrutalButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "neon" | "secondary" | "destructive" | "ghost";
  size?: "sm" | "md" | "lg";
}

const variantStyles = {
  primary:
    "bg-primary text-primary-foreground border-2 border-border shadow-brutal dark:shadow-brutal-neon",
  neon: "bg-neon text-black border-2 border-border shadow-brutal dark:shadow-brutal-neon",
  secondary:
    "bg-secondary text-secondary-foreground border-2 border-border shadow-brutal dark:shadow-brutal-neon",
  destructive:
    "bg-destructive text-destructive-foreground border-2 border-border shadow-brutal dark:shadow-brutal-neon",
  ghost:
    "bg-transparent text-foreground border-2 border-transparent hover:border-border",
};

const sizeStyles = {
  sm: "px-3 py-1 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

function BrutalButton({
  className,
  variant = "primary",
  size = "md",
  disabled,
  children,
  ...props
}: BrutalButtonProps) {
  return (
    <button
      className={cn(
        "font-semibold uppercase tracking-wider transition-all duration-100",
        variantStyles[variant],
        sizeStyles[size],
        !disabled &&
          "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg dark:hover:shadow-[6px_6px_0px_0px_#00FF41] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default BrutalButton;
