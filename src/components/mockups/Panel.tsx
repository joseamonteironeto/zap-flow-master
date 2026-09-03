import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border panel-gradient shadow-[var(--shadow-panel)]",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-border bg-surface/60 px-4 py-3">
        <span className="flex shrink-0 gap-1.5">
          <span className="size-2.5 rounded-full bg-muted-foreground/30" />
          <span className="size-2.5 rounded-full bg-muted-foreground/30" />
          <span className="size-2.5 rounded-full bg-primary/60" />
        </span>
        <span className="truncate text-xs font-medium text-muted-foreground">{title}</span>
      </div>
      <div className={cn("p-4 sm:p-5", bodyClassName)}>{children}</div>
    </div>
  );
}

export function Bars({ data, className }: { data: number[]; className?: string }) {
  const max = Math.max(1, ...data);
  return (
    <div className={cn("flex h-24 items-end gap-1.5", className)}>
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-[4px] bg-primary/70"
          style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 32 - ((v - min) / Math.max(1, max - min)) * 28 - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className={cn("h-16 w-full", className)}>
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        vectorEffect="non-scaling-stroke"
        className="text-primary"
      />
      <polyline
        points={`0,32 ${points} 100,32`}
        className="fill-primary/12"
        stroke="none"
      />
    </svg>
  );
}
