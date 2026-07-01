import { useState } from "react";
import { useMutation } from "convex/react";
import { MoreHorizontal, Target } from "lucide-react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";

import { Badge } from "@/components/ui/badge";
import { CompletionToggle } from "@/components/ui/completion-toggle";
import { cn } from "@/lib/utils";

interface TaskRowProps {
  taskId: Id<"dailyTasks">;
  title: string;
  description?: string;
  status: "open" | "completed" | "dismissed";
  isCarriedOver: boolean;
  originalDate: string;
  carryoverCount: number;
  viewedDate: string;
  goalTitle?: string;
  readOnly?: boolean;
}

function prettyOriginalDate(date: string): string {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function TaskRow({
  taskId,
  title,
  description,
  status,
  isCarriedOver,
  originalDate,
  carryoverCount,
  viewedDate,
  goalTitle, readOnly,
}: TaskRowProps) {
  const complete = useMutation(api.dailyTasks.complete);
  const uncomplete = useMutation(api.dailyTasks.uncomplete);
  const dismiss = useMutation(api.dailyTasks.dismiss);
  const remove = useMutation(api.dailyTasks.remove);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggle = () => {
    if (status === "completed") void uncomplete({ taskId });
    else void complete({ taskId, today: viewedDate });
  };

  const meta = description?.trim()
    ? description
    : isCarriedOver
      ? `Original ${prettyOriginalDate(originalDate)}`
      : "Today";

  return (
    <div
      className={cn(
        "group flex items-center gap-3.5 rounded-[12px] border border-[var(--border-subtle)] bg-card px-4 py-3.5 shadow-[var(--shadow-sm)] transition-all duration-150",
        status === "dismissed" ? "opacity-55" : "hover:shadow-[var(--shadow-md)] hover:-translate-y-px",
      )}
    >
      <CompletionToggle
        state={status === "completed" ? "completed" : "pending"}
        onToggle={readOnly ? () => {} : toggle}
        ariaLabel={`Mark ${title} ${status === "completed" ? "incomplete" : "complete"}`}
      />
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-[15px] font-semibold leading-snug text-foreground",
            status === "completed" &&
              "line-through decoration-[var(--slate-300)] dark:decoration-[var(--slate-600)]",
          )}
        >
          {title}
        </div>
        <div className="mt-[3px] text-[12px] text-[var(--text-tertiary)] truncate">{meta}</div>
        {goalTitle && (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--indigo-50)] px-2 py-0.5 text-[10px] font-semibold text-[var(--indigo-600)]">
            <Target className="size-2.5" />{goalTitle}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isCarriedOver && status === "open" && (
          <Badge tone="carryover">
            ×<span className="font-mono">{carryoverCount}</span> carried
          </Badge>
        )}
        {status === "dismissed" && <Badge tone="neutral">Dismissed</Badge>}
        {!readOnly && <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-[var(--surface-hover)] hover:text-foreground transition-all duration-150"
            aria-label="More options"
          >
            <MoreHorizontal className="size-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 bottom-full mb-1 z-20 min-w-[140px] overflow-hidden rounded-[12px] border border-[var(--border-subtle)] bg-card shadow-[var(--shadow-md)]">
                {status === "dismissed" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => { void uncomplete({ taskId }); setMenuOpen(false); }}
                      className="w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-foreground hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      Restore
                    </button>
                    <div className="mx-3 h-px bg-[var(--border-subtle)]" />
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => { void dismiss({ taskId }); setMenuOpen(false); }}
                      className="w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-foreground hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      Dismiss
                    </button>
                    <div className="mx-3 h-px bg-[var(--border-subtle)]" />
                  </>
                )}
                <button
                  type="button"
                  onClick={() => { void remove({ taskId }); setMenuOpen(false); }}
                  className="w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-[var(--red-600)] hover:bg-[var(--red-50)] dark:hover:bg-[rgba(220,38,38,0.10)] transition-colors"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>}
      </div>
    </div>
  );
}
