import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type CompletionState = "pending" | "completed" | "skipped";

interface CompletionToggleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  state: CompletionState;
  onToggle: () => void;
  ariaLabel?: string;
}

const CompletionToggle = React.forwardRef<HTMLButtonElement, CompletionToggleProps>(
  ({ state, onToggle, ariaLabel, className, ...props }, ref) => {
    const isComplete = state === "completed";
    const isSkipped = state === "skipped";
    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={isComplete}
        aria-label={ariaLabel ?? "Toggle completion"}
        onClick={onToggle}
        className={cn(
          "relative inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-0",
          isComplete
            ? "border-[var(--status-complete)] bg-[var(--status-complete)] text-white shadow-[var(--shadow-success)]"
            : isSkipped
              ? "border-[var(--slate-300)] bg-[var(--slate-100)] text-muted-foreground"
              : "border-[var(--slate-300)] bg-card hover:border-[var(--green-500)] hover:bg-[var(--green-50)]",
          className,
        )}
        {...props}
      >
        {isComplete && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        {isSkipped && (
          <span className="block h-0.5 w-2.5 rounded-full bg-[var(--slate-400)]" />
        )}
      </button>
    );
  },
);
CompletionToggle.displayName = "CompletionToggle";

export { CompletionToggle };
