import { useState } from "react";
import { MoreHorizontal } from "lucide-react";

// Extracted from routine-row.tsx to keep that file within the project's
// 150-line limit. Same menu and click-catcher idiom as before.
interface RoutineRowMenuProps {
  isSkipped: boolean;
  onSkipToggle: () => void;
  onArchive: () => void;
}

export function RoutineRowMenu({
  isSkipped,
  onSkipToggle,
  onArchive,
}: RoutineRowMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative">
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
              onClick={() => { onSkipToggle(); setMenuOpen(false); }}
              className="w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-foreground hover:bg-[var(--surface-hover)] transition-colors"
            >
              {isSkipped ? "Un-skip" : "Skip today"}
            </button>
            <div className="mx-3 h-px bg-[var(--border-subtle)]" />
            <button
              type="button"
              onClick={() => { onArchive(); setMenuOpen(false); }}
              className="w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              Archive
            </button>
          </div>
        </>
      )}
    </div>
  );
}
