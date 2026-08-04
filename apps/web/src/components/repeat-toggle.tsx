import { Repeat } from "lucide-react";

// The "Repeat several times a day" pill shared by the routine create and edit
// forms. Extracted because both carried the same 12-line button and both were
// over the project's 150-line limit.
export function RepeatToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-2 self-start rounded-[8px] px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${
        enabled
          ? "bg-[var(--action-primary)] text-white"
          : "text-[var(--text-tertiary)] hover:text-foreground hover:bg-[var(--surface-hover)]"
      }`}
    >
      <Repeat className="size-3.5" />
      Repeat several times a day
    </button>
  );
}
