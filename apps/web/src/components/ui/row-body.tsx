import { cn } from "@/lib/utils";
import { GoalTag } from "@/components/ui/goal-tag";

interface RowBodyProps {
  title: string;
  meta: string;
  error?: string | null;
  goalTitle?: string;
  /** Struck through once the item is done. */
  completed?: boolean;
}

/**
 * The middle column of a list row: title, meta line, error, goal tag.
 *
 * Task and routine rows declared this identically, down to the `mt-[3px]` on
 * both the meta and the error.
 */
export function RowBody({
  title,
  meta,
  error,
  goalTitle,
  completed,
}: RowBodyProps) {
  return (
    <div className="flex-1 min-w-0">
      <div
        className={cn(
          "text-[15px] font-semibold leading-snug text-foreground",
          completed && "line-through decoration-[var(--border-strong)]",
        )}
      >
        {title}
      </div>
      <div className="mt-[3px] text-[12px] text-[var(--text-tertiary)] truncate">
        {meta}
      </div>
      {error && (
        <div className="mt-[3px] text-[12px] text-[var(--status-danger)]">
          {error}
        </div>
      )}
      {goalTitle && <GoalTag>{goalTitle}</GoalTag>}
    </div>
  );
}
