import { useState } from "react";
import { useMutation } from "convex/react";
import { MoreHorizontal, Target } from "lucide-react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id, Doc } from "@cadence/backend/convex/_generated/dataModel";
import { todayLocal } from "@cadence/shared";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompletionToggle } from "@/components/ui/completion-toggle";
import { StreakBadge } from "@/components/ui/streak-badge";
import { cn } from "@/lib/utils";

const DAY_LABEL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function scheduleMeta(
  scheduleType: Doc<"routines">["scheduleType"],
  customDays?: number[],
): string {
  if (scheduleType === "daily") return "Every day";
  if (scheduleType === "weekdays") return "Weekdays";
  if (!customDays || customDays.length === 0) return "Custom";
  if (customDays.length === 7) return "Every day";
  return customDays.map((d) => DAY_LABEL[d]).join(" · ");
}

interface RoutineRowProps {
  routineId: Id<"routines">;
  name: string;
  description?: string;
  scheduleType: Doc<"routines">["scheduleType"];
  customDays?: number[];
  status: "completed" | "skipped" | "pending";
  currentStreak: number;
  viewedDate: string;
  goalTitle?: string;
  readOnly?: boolean;
}

export function RoutineRow({
  routineId,
  name,
  description,
  scheduleType,
  customDays,
  status,
  currentStreak,
  viewedDate,
  goalTitle, readOnly,
}: RoutineRowProps) {
  const complete = useMutation(api.routines.complete);
  const uncomplete = useMutation(api.routines.uncomplete);
  const skip = useMutation(api.routines.skip);
  const archive = useMutation(api.routineManagement.archive);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggle = () => {
    const today = todayLocal();
    if (status === "completed")
      void uncomplete({ routineId, date: viewedDate, today });
    else void complete({ routineId, date: viewedDate, today });
  };

  const handleSkip = () => {
    const today = todayLocal();
    if (status === "skipped")
      void uncomplete({ routineId, date: viewedDate, today });
    else void skip({ routineId, date: viewedDate, today });
    setMenuOpen(false);
  };

  const handleArchive = () => { void archive({ routineId, today: todayLocal() }); setMenuOpen(false); };

  const meta = description?.trim()
    ? description
    : scheduleMeta(scheduleType, customDays);

  return (
    <div
      className={cn(
        "group flex items-center gap-3.5 rounded-[12px] border border-[var(--border-subtle)] bg-card px-4 py-3.5 shadow-[var(--shadow-sm)] transition-all duration-150",
        status === "skipped" ? "opacity-55" : "hover:shadow-[var(--shadow-md)] hover:-translate-y-px",
      )}
    >
      <CompletionToggle
        state={status}
        onToggle={readOnly ? () => {} : toggle}
        ariaLabel={`Mark ${name} ${status === "completed" ? "incomplete" : "complete"}`}
      />
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-[15px] font-semibold leading-snug text-foreground",
            status === "completed" &&
              "line-through decoration-[var(--slate-300)] dark:decoration-[var(--slate-600)]",
          )}
        >
          {name}
        </div>
        <div className="mt-[3px] text-[12px] text-[var(--text-tertiary)] truncate">{meta}</div>
        {goalTitle && (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--indigo-50)] px-2 py-0.5 text-[10px] font-semibold text-[var(--indigo-600)]">
            <Target className="size-2.5" />{goalTitle}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {status === "skipped" ? (
          <Badge tone="neutral">Skipped</Badge>
        ) : (
          <StreakBadge count={currentStreak} size="sm" />
        )}
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
              <div className="absolute right-0 top-[38px] z-20 min-w-[152px] overflow-hidden rounded-[12px] border border-[var(--border-subtle)] bg-card shadow-[var(--shadow-md)]">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-foreground hover:bg-[var(--surface-hover)] transition-colors"
                >
                  {status === "skipped" ? "Un-skip" : "Skip today"}
                </button>
                <div className="mx-3 h-px bg-[var(--border-subtle)]" />
                <button
                  type="button"
                  onClick={handleArchive}
                  className="w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  Archive
                </button>
              </div>
            </>
          )}
        </div>}
      </div>
    </div>
  );
}
