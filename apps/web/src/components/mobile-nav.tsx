import { useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";
import type { AppView } from "@/App";
import { SidebarNav } from "./sidebar-nav";

interface MobileNavProps {
  view: AppView;
  onNavigate: (view: AppView) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Burger + left slide-in drawer, below `md`. Renders the same SidebarNav as the
 * desktop aside — the drawer is a container, not a second navigation.
 *
 * Before this the web app had NO navigation at all under `md`: the sidebar is
 * `hidden md:flex`, so a narrow viewport could reach only whichever page it
 * loaded on.
 */
export function MobileNav({ view, onNavigate, open, onOpenChange }: MobileNavProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape closes; focus is trapped while open; the page behind cannot scroll.
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

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation"
        aria-expanded={open}
        onClick={() => onOpenChange(true)}
        className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-[var(--surface-card)] text-[var(--text-secondary)] transition-colors hover:text-foreground md:hidden"
      >
        <Menu className="size-[18px]" strokeWidth={2} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-[var(--bg-app)]/70 backdrop-blur-[2px]"
            onClick={() => onOpenChange(false)}
            aria-hidden="true"
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 left-0 flex w-[250px] max-w-[80%] flex-col overflow-y-auto border-r border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-5 shadow-[var(--shadow-md)]"
          >
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => onOpenChange(false)}
              className="absolute right-3 top-4 flex size-7 items-center justify-center rounded-sm text-[var(--text-tertiary)] transition-colors hover:text-foreground"
            >
              <X className="size-4" strokeWidth={2} />
            </button>
            <SidebarNav
              view={view}
              onNavigate={(v) => {
                onNavigate(v);
                onOpenChange(false);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
