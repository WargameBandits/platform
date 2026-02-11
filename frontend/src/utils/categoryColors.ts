const categoryColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  pwn: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/30",
  },
  reversing: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/30",
  },
  crypto: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  web: {
    bg: "bg-green-500/10",
    text: "text-green-400",
    border: "border-green-500/30",
  },
  forensics: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/30",
  },
  misc: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/30",
  },
};

const defaultColor = {
  bg: "bg-secondary",
  text: "text-secondary-foreground",
  border: "border-border",
};

export function getCategoryColor(category: string) {
  return categoryColors[category.toLowerCase()] ?? defaultColor;
}

export default categoryColors;
