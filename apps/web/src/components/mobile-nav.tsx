import { Menu } from "lucide-react";
import type { AppView } from "@/App";
import { Drawer } from "@/components/ui/drawer";
import { SidebarNav } from "./sidebar-nav";

interface MobileNavProps {
  view: AppView;
  onNavigate: (view: AppView) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Burger + left slide-in navigation, below `md`.
 *
 * Renders the same SidebarNav as the desktop aside inside the same Drawer the
 * detail panels use — the drawer is a container, not a second navigation, and
 * its escape/backdrop/focus behaviour is not reimplemented here.
 *
 * Before this the web app had NO navigation at all under `md`.
 */
export function MobileNav({ view, onNavigate, open, onOpenChange }: MobileNavProps) {
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
        <div className="md:hidden">
          <Drawer
            open={open}
            onOpenChange={onOpenChange}
            side="left"
            label="Navigation"
            className="w-[250px] max-w-[80%] bg-[var(--bg-elevated)] px-3.5 py-5"
          >
            <SidebarNav
              view={view}
              onNavigate={(v) => {
                onNavigate(v);
                onOpenChange(false);
              }}
            />
          </Drawer>
        </div>
      )}
    </>
  );
}
