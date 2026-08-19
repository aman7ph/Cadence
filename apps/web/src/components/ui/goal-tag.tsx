import { Target } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The gold pill naming the goal a row feeds.
 *
 * Four rows declared this identically — task, routine, active-routine and
 * staged-task — which is three copies waiting to drift.
 */
export function GoalTag({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "mt-1 inline-flex items-center gap-1 rounded-pill bg-[var(--surface-accent)] px-2 py-[2px] text-[9px] font-semibold uppercase tracking-[0.04em] text-[var(--text-accent)]",
        className,
      )}
    >
      <Target className="size-2.5" />
      {children}
    </span>
  );
}
