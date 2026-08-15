import { useState, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { Settings2 } from "lucide-react";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { api } from "@cadence/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ComposerGoalPanel } from "./composer-goal-panel";
import { ComposerSpreadPanel } from "./composer-spread-panel";

export interface ComposerValues {
  title: string;
  goalId?: Id<"goals">;
  goalContribution?: number;
  repeatTarget?: number;
  repeatIntervalMinutes?: number;
}

interface TaskComposerProps {
  placeholder: string;
  /** Inline CTA next to the input, e.g. "Add". */
  submitLabel?: string;
  /** CTA in the expanded panel's footer, e.g. "Add task". */
  panelSubmitLabel?: string;
  onSubmit: (values: ComposerValues) => Promise<void>;
  /** Page-specific controls above the panel footer (Staging's destination). */
  extra?: ReactNode;
  className?: string;
}

/**
 * The composer — identical across Today, Routines and Staging, which the design
 * handoff calls the "consistency rule enforced throughout". One component with
 * props, never three copies (D15).
 *
 * Collapsed it is input + gear + CTA. The gear reveals goal contribution and
 * spread-across-the-day. The behaviour behind both already ships; this is
 * presentation only.
 */
export function TaskComposer({
  placeholder,
  submitLabel = "Add",
  panelSubmitLabel = "Add task",
  onSubmit,
  extra,
  className,
}: TaskComposerProps) {
  const goals = useQuery(api.goals.list, {}) ?? [];
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [goalId, setGoalId] = useState<Id<"goals"> | "">("");
  const [contribution, setContribution] = useState(1);
  const [spread, setSpread] = useState(false);
  const [target, setTarget] = useState(2);
  const [interval, setInterval] = useState(60);
  const [pending, setPending] = useState(false);

  const reset = () => {
    setTitle("");
    setGoalId("");
    setContribution(1);
    setSpread(false);
    setTarget(2);
    setInterval(60);
    setOpen(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || pending) return;
    setPending(true);
    try {
      await onSubmit({
        title: trimmed,
        goalId: goalId || undefined,
        goalContribution: goalId ? contribution : undefined,
        repeatTarget: spread ? target : undefined,
        repeatIntervalMinutes: spread ? interval : undefined,
      });
      reset();
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className={cn("flex flex-col gap-2.5", className)}>
      <div className="flex items-center gap-2">
        <Input
          placeholder={placeholder}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={pending}
          className="flex-1"
        />
        <Button
          type="button"
          variant={open ? "segment" : "outline"}
          selected={open}
          size="icon"
          aria-label="Goal and repeat options"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <Settings2 className="size-4" />
        </Button>
        {/* Only one submit is visible at a time. When the panel is open its
            footer owns the action, so showing this one too would be the same
            action twice. */}
        {!open && (
          <Button type="submit" disabled={pending || !title.trim()}>
            {submitLabel}
          </Button>
        )}
      </div>

      {open && (
        <div className="flex flex-col gap-4 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-sunken)] p-4">
          <div className="flex flex-col gap-5 md:flex-row">
            <ComposerGoalPanel
              goals={goals}
              goalId={goalId}
              contribution={contribution}
              onSelect={setGoalId}
              onContributionChange={setContribution}
            />
            <ComposerSpreadPanel
              enabled={spread}
              onEnabledChange={setSpread}
              target={target}
              onTargetChange={setTarget}
              intervalMinutes={interval}
              onIntervalChange={setInterval}
            />
          </div>
          {extra}
          <div className="flex items-center justify-end gap-3 border-t border-[var(--border-subtle)] pt-3">
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending || !title.trim()}>
              {panelSubmitLabel}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
