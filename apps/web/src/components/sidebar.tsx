import type { AppView } from "@/App";
import { SidebarNav } from "./sidebar-nav";

interface SidebarProps {
  view: AppView;
  onNavigate: (view: AppView) => void;
}

/**
 * Persistent desktop rail. Below `md` it is hidden and MobileNav takes over —
 * both render the same SidebarNav.
 */
export function Sidebar({ view, onNavigate }: SidebarProps) {
  return (
    <aside className="hidden flex-col overflow-y-auto border-r border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-5 md:flex md:w-[236px] md:shrink-0">
      <SidebarNav view={view} onNavigate={onNavigate} showThemeToggle />
    </aside>
  );
}
