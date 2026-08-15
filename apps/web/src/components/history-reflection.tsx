import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { ReflectionText } from "./history-reflection-text";
import { SectionLabel } from "./section-label";

interface HistoryReflectionProps {
  date: string;
}

export function HistoryReflection({ date }: HistoryReflectionProps) {
  const day = useQuery(api.days.getDay, { date });

  if (!day) return null;

  return (
    <section className="flex flex-col gap-2">
      <SectionLabel>Reflection</SectionLabel>
      {day.reflection ? (
        <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3.5">
          <ReflectionText
            text={day.reflection.text}
            taggedRoutineIds={day.reflection.taggedRoutineIds as string[]}
            taggedTaskIds={day.reflection.taggedTaskIds as string[]}
          />
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-[var(--border-subtle)] px-4 py-3.5 text-[13px] italic text-[var(--text-tertiary)]">
          No reflection written for this day.
        </p>
      )}
    </section>
  );
}
