import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which edge it slides in from. */
  side?: "left" | "right";
  /** Accessible name for the dialog. */
  label: string;
  /** Rendered in the top-right; omit for a bare close icon. */
  closeLabel?: string;
  className?: string;
  children: ReactNode;
}

/**
 * One slide-over, used by the mobile navigation (left) and by Goals and History
 * detail (right). The escape/backdrop/focus-trap/scroll-lock behaviour lives
 * here once rather than in each caller (D15).
 *
 * Width is a `className` concern so callers can size it; the prototype's detail
 * drawer measures 513px, the mobile nav 250px.
 */
export function Drawer({
  open,
  onOpenChange,
  side = "right",
  label,
  closeLabel,
  className,
  children,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-[var(--bg-app)]/70 backdrop-blur-[2px]"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cn(
          "absolute inset-y-0 flex flex-col overflow-y-auto bg-[var(--bg-app)] shadow-[var(--shadow-md)]",
          side === "right"
            ? "right-0 border-l border-[var(--border-subtle)]"
            : "left-0 border-r border-[var(--border-subtle)]",
          className,
        )}
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
          className={cn(
            "absolute top-4 z-10 flex items-center gap-1.5 rounded-sm text-[13px] text-[var(--text-secondary)] transition-colors hover:text-foreground",
            side === "right" ? "right-5" : "right-3",
          )}
        >
          <X className="size-4" strokeWidth={2} />
          {closeLabel}
        </button>
        {children}
      </div>
    </div>
  );
}
