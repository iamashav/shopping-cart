import { cn } from "@/lib/utils";

const LABELS = ["Light", "Light-medium", "Medium", "Medium-dark", "Dark"];

export function RoastLevel({ level, className }: { level: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((step) => (
          <span
            key={step}
            className={cn(
              "size-2 rounded-full border border-primary",
              step <= level ? "bg-primary" : "opacity-30",
            )}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{LABELS[level - 1]} roast</span>
    </div>
  );
}
