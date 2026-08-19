import { cn } from "@/lib/utils";
import type { MentionOption } from "@/lib/use-mention-text";

interface MentionMenuProps {
  options: MentionOption[];
  activeIndex: number;
  onPick: (id: string, name: string) => void;
}

/**
 * The `@` autocomplete over the reflection textarea.
 *
 * `onMouseDown` with `preventDefault`, not `onClick`: a click would blur the
 * textarea first and the caret position the insert depends on would be gone.
 *
 * Type dots follow the composer: routines take the accent, tasks `chart-3`.
 */
export function MentionMenu({
  options,
  activeIndex,
  onPick,
}: MentionMenuProps) {
  return (
    <div className="no-scrollbar absolute bottom-full left-5 z-30 mb-2 max-h-[220px] w-[min(320px,calc(100%-2.5rem))] overflow-y-auto rounded-md border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-md)]">
      {options.map((opt, i) => (
        <button
          key={opt.id}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onPick(opt.id, opt.name);
          }}
          className={cn(
            "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] transition-colors",
            i === activeIndex
              ? "bg-[var(--surface-accent)] text-[var(--text-accent)]"
              : "text-foreground hover:bg-[var(--surface-hover)]",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              opt.type === "routine"
                ? "bg-[var(--text-accent)]"
                : "bg-[var(--chart-3)]",
            )}
          />
          <span className="flex-1 truncate font-medium">{opt.name}</span>
          <span className="shrink-0 text-[11px] text-[var(--text-tertiary)]">
            {opt.type}
          </span>
        </button>
      ))}
    </div>
  );
}
