import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ReflectionEditor } from "./today-reflection-editor";

interface Reflection {
  text: string;
  taggedRoutineIds: string[];
  taggedTaskIds: string[];
  updatedAt: number;
}

interface Routine { routineId: string; name: string; }
interface Task { taskId: string; title: string; status: "open" | "completed" | "dismissed"; }

interface TodayReflectionSectionProps {
  date: string;
  reflection: Reflection | null;
  routines: Routine[];
  tasks: Task[];
  isPast: boolean;
}

function MentionText({ text, routineIds }: { text: string; routineIds: Set<string> }) {
  const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(<span key={key++}>{text.slice(last, match.index)}</span>);
    parts.push(
      <Badge key={key++} tone={routineIds.has(match[2]!) ? "accent" : "carryover"} className="mx-0.5 align-baseline text-[11px]">
        @{match[1]!}
      </Badge>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(<span key={key++}>{text.slice(last)}</span>);
  return <>{parts}</>;
}

export function TodayReflectionSection({ date, reflection, routines, tasks, isPast }: TodayReflectionSectionProps) {
  const [mode, setMode] = useState<"view" | "edit">(() => reflection ? "view" : "edit");

  if (isPast && !reflection) return null;

  const routineIds = new Set(routines.map((r) => r.routineId));
  const taggedRoutines = reflection
    ? reflection.taggedRoutineIds.map((id) => routines.find((r) => r.routineId === id)).filter((r): r is Routine => r !== undefined)
    : [];
  const taggedTasks = reflection
    ? reflection.taggedTaskIds.map((id) => tasks.find((t) => t.taskId === id)).filter((t): t is Task => t !== undefined)
    : [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.10em] text-[var(--text-tertiary)]">Reflection</h2>
        {mode === "view" && (
          <button type="button" onClick={() => setMode("edit")}
            className="text-[12px] font-semibold text-[var(--text-accent)] hover:underline">
            Edit
          </button>
        )}
      </div>

      {mode === "view" && reflection ? (
        <div className="rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3.5 shadow-[var(--shadow-sm)]">
          <p className="text-[14px] leading-relaxed text-foreground whitespace-pre-wrap">
            <MentionText text={reflection.text} routineIds={routineIds} />
          </p>
          {(taggedRoutines.length > 0 || taggedTasks.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[var(--border-subtle)] pt-3">
              {taggedRoutines.map((r) => <Badge key={r.routineId} tone="accent">{r.name}</Badge>)}
              {taggedTasks.map((t) => <Badge key={t.taskId} tone="carryover">{t.title}</Badge>)}
            </div>
          )}
        </div>
      ) : mode === "edit" ? (
        <ReflectionEditor
          date={date}
          initialText={reflection?.text ?? ""}
          routines={routines}
          tasks={tasks}
          hasExisting={reflection !== null}
          onSaved={() => setMode("view")}
          onCancel={() => setMode("view")}
        />
      ) : null}
    </div>
  );
}
