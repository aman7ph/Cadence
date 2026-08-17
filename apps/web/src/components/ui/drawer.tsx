import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Width lives here rather than at each call site, where it had been repeated in
 * five places and would drift the moment one was changed.
 *
 * `panel` scales with the viewport: a phone gets the whole screen, a laptop a
 * comfortable column, a large monitor more room. The old fixed 513px came from
 * the prototype's read-only detail panel — the forms that now use the same
 * container stack a title, description, schedule chips, the goal list and the
 * spread panel, and were cramped at that width.
 */
const DRAWER_SIZE = {
  /** Mobile navigation. */
  nav: "w-[250px] max-w-[80%]",
  /** A question and two buttons — width here is just wasted space. */
  confirm: "w-full sm:w-[440px]",
  /** Create / edit forms: roomy, but a single column of fields. */
  form: "w-full sm:w-[560px] lg:w-[640px] xl:w-[700px]",
  /** Reading panels — Goals and History detail. At least half the viewport
   *  from `md` up (65vw → 55vw → 50vw), full width below it. */
  wide: "w-full md:w-[65vw] lg:w-[55vw] xl:w-[50vw]",
} as const;

export type DrawerSize = keyof typeof DRAWER_SIZE;

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which edge it slides in from. */
  side?: "left" | "right";
  /** Accessible name for the dialog. */
  label: string;
  /** Rendered in the top-right; omit for a bare close icon. */
  closeLabel?: string;
  /** Chosen by the page. Values live here so five call sites cannot drift. */
  size?: DrawerSize;
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
  size = "form",
  className,
  children,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Held in a ref so the effect below can depend on `open` ALONE. Every caller
  // passes an inline arrow, so `onOpenChange` has a new identity on every
  // render — with it in the dependency array the effect re-ran on each
  // keystroke and its focus() call stole the cursor out of the input after a
  // single character.
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChangeRef.current(false);
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
    // Only move focus if it is not already inside the panel — an input with
    // autoFocus has usually claimed it by now, and jumping to the close button
    // would undo that.
    if (!panelRef.current?.contains(document.activeElement)) {
      panelRef.current
        ?.querySelector<HTMLElement>("input, textarea, select, button")
        ?.focus();
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

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
          DRAWER_SIZE[size],
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
