import { cn } from "../../utils/cn";

interface PixelLoaderProps {
  text?: string;
  className?: string;
}

function PixelLoader({ text = "LOADING", className }: PixelLoaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-1 py-8",
        className
      )}
    >
      <span className="font-pixel text-sm text-foreground">{text}</span>
      <span className="font-pixel text-sm text-neon animate-blink">_</span>
    </div>
  );
}

export default PixelLoader;
