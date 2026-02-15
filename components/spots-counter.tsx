"use client";

import { cn } from "@/lib/utils";

interface SpotsCounterProps {
  total: number;
  taken: number;
  inverted?: boolean;
  className?: string;
}

export function SpotsCounter({
  total,
  taken,
  inverted,
  className,
}: SpotsCounterProps) {
  const remaining = total - taken;
  const pct = (taken / total) * 100;

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "h-1.5 w-20 sm:w-24",
          inverted ? "bg-background/15" : "bg-foreground/10",
        )}
      >
        <div
          className={cn(
            "h-full transition-all duration-1000",
            inverted ? "bg-primary/70" : "bg-foreground/70",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={cn(
          "font-pixel text-[10px] tracking-wider",
          remaining <= 5 && "animate-pulse-subtle",
          inverted ? "text-background/60" : "text-primary",
        )}
      >
        {remaining}/{total} LEFT
      </span>
    </div>
  );
}
