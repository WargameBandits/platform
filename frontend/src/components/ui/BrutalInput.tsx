import { forwardRef } from "react";
import { cn } from "../../utils/cn";

interface BrutalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const BrutalInput = forwardRef<HTMLInputElement, BrutalInputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full border-2 border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:shadow-brutal-neon focus:border-neon transition-shadow",
          error && "border-destructive focus:shadow-[4px_4px_0px_0px_hsl(0_84%_60%)]",
          className
        )}
        {...props}
      />
    );
  }
);

BrutalInput.displayName = "BrutalInput";

export default BrutalInput;
