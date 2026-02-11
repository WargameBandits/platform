import { cn } from "../../utils/cn";

interface Tab {
  value: string;
  label: string;
}

interface BrutalTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (value: string) => void;
  className?: string;
}

function BrutalTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
}: BrutalTabsProps) {
  return (
    <div className={cn("flex flex-wrap gap-0", className)}>
      {tabs.map((tab) => {
        const isActive = tab.value === activeTab;
        return (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={cn(
              "border-2 border-border px-4 py-2 font-retro text-sm uppercase tracking-wider transition-all duration-100",
              isActive
                ? "bg-foreground text-background shadow-brutal-sm dark:shadow-[2px_2px_0px_0px_#00FF41] -translate-x-px -translate-y-px"
                : "bg-background text-foreground hover:bg-muted active:translate-x-px active:translate-y-px",
              "-ml-0.5 first:ml-0"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default BrutalTabs;
