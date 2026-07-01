import { useState } from "react";
import { useMutation } from "convex/react";
import { Plus } from "lucide-react";
import { api } from "@cadence/backend/convex/_generated/api";
import { todayLocal } from "@cadence/shared";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ScheduleType = "daily" | "weekdays" | "custom";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;

export function AddRoutineForm() {
  const create = useMutation(api.routines.create);
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState("");
  const [scheduleType, setScheduleType] = useState<ScheduleType>("daily");
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [pending, setPending] = useState(false);

  const reset = () => {
    setName("");
    setScheduleType("daily");
    setCustomDays([]);
    setExpanded(false);
  };

  const toggleDay = (d: number) => {
    setCustomDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort(),
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (scheduleType === "custom" && customDays.length === 0) return;
    setPending(true);
    try {
      await create({
        name: name.trim(),
        scheduleType,
        customDays: scheduleType === "custom" ? customDays : undefined,
        today: todayLocal(),
      });
      reset();
    } finally {
      setPending(false);
    }
  };

  if (!expanded) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(true)}
        className="self-start text-muted-foreground hover:text-foreground"
      >
        <Plus className="size-4" />
        New routine
      </Button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 rounded-md border border-border bg-card p-4 shadow-[var(--shadow-sm)]"
    >
      <Input
        autoFocus
        placeholder="Routine name (e.g. Morning run)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={pending}
      />
      <div className="flex flex-wrap gap-2">
        {(["daily", "weekdays", "custom"] as ScheduleType[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScheduleType(s)}
            className={cn(
              "h-8 rounded-full border px-3 text-xs font-medium capitalize transition-colors",
              scheduleType === s
                ? "border-[var(--indigo-500)] bg-[var(--surface-accent)] text-[var(--text-accent)]"
                : "border-border bg-card text-muted-foreground hover:bg-[var(--surface-hover)]",
            )}
            disabled={pending}
          >
            {s}
          </button>
        ))}
      </div>
      {scheduleType === "custom" && (
        <div className="flex gap-1.5">
          {WEEKDAY_LABELS.map((label, idx) => {
            const active = customDays.includes(idx);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => toggleDay(idx)}
                className={cn(
                  "h-8 w-8 rounded-full border text-xs font-semibold transition-colors",
                  active
                    ? "border-[var(--indigo-500)] bg-[var(--indigo-600)] text-white"
                    : "border-border bg-card text-muted-foreground hover:bg-[var(--surface-hover)]",
                )}
                aria-label={`Toggle ${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][idx]}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={
            pending ||
            !name.trim() ||
            (scheduleType === "custom" && customDays.length === 0)
          }
        >
          Add routine
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={reset}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
