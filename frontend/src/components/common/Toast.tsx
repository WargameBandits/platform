import { Toaster, toast } from "sonner";

function BrutalToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "border-2 border-border bg-card text-card-foreground shadow-brutal dark:shadow-brutal-neon p-4 w-[360px]",
          title: "font-retro text-lg",
          description: "font-sans text-sm text-muted-foreground mt-1",
        },
      }}
    />
  );
}

function achievementToast(title: string, description?: string) {
  toast.custom(() => (
    <div className="border-2 border-neon bg-card p-4 shadow-brutal-neon animate-achievement w-[360px]">
      <div className="flex items-center gap-3">
        <div className="border-2 border-neon bg-neon/20 px-2 py-1">
          <span className="font-pixel text-[8px] text-neon">★</span>
        </div>
        <div>
          <p className="font-pixel text-[10px] text-neon uppercase">
            Achievement Unlocked
          </p>
          <p className="font-retro text-lg text-foreground mt-1">{title}</p>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  ));
}

function errorToast(title: string, description?: string) {
  toast.custom(() => (
    <div className="border-2 border-destructive bg-card p-4 shadow-[4px_4px_0px_0px_hsl(0_84%_60%)] w-[360px]">
      <div className="flex items-center gap-3">
        <div className="border-2 border-destructive bg-destructive/20 px-2 py-1">
          <span className="font-pixel text-[8px] text-destructive">X</span>
        </div>
        <div>
          <p className="font-pixel text-[10px] text-destructive uppercase">
            Error
          </p>
          <p className="font-retro text-lg text-foreground mt-1">{title}</p>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  ));
}

export { BrutalToaster, achievementToast, errorToast };
export { toast };
