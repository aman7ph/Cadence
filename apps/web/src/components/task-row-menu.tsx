import { useState } from "react";
import { MoreHorizontal } from "lucide-react";

// Extracted from task-row.tsx to keep that file within the project's
// 150-line limit. Same hand-rolled menu and click-catcher idiom as before.
interface TaskRowMenuProps {
  isDismissed: boolean;
  onRestore: () => void;
  onDismiss: () => void;
  onDelete: () => void;
}

export function TaskRowMenu({
  isDismissed,
  onRestore,
  onDismiss,
  onDelete,
}: TaskRowMenuProps) {
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
          <div className="absolute right-0 bottom-full mb-1 z-20 min-w-[140px] overflow-hidden rounded-[12px] border border-[var(--border-subtle)] bg-card shadow-[var(--shadow-md)]">
            <button
              type="button"
              onClick={() => {
                isDismissed ? onRestore() : onDismiss();
                setMenuOpen(false);
              }}
              className="w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-foreground hover:bg-[var(--surface-hover)] transition-colors"
            >
              {isDismissed ? "Restore" : "Dismiss"}
            </button>
            <div className="mx-3 h-px bg-[var(--border-subtle)]" />
            <button
              type="button"
              onClick={() => {
                onDelete();
                setMenuOpen(false);
              }}
              className="w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-[var(--red-600)] hover:bg-[var(--red-50)] dark:hover:bg-[rgba(220,38,38,0.10)] transition-colors"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
