import { useClerk, useUser, SignOutButton } from "@clerk/clerk-react";
import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  ListChecks,
  LogOut,
  Moon,
  Settings,
  Sun,
  Target,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import { useTheme } from "@/lib/theme";
import type { AppView } from "@/App";
import { TodayWidget } from "./sidebar-today-widget";
import { NavItem } from "./sidebar-nav-item";

interface SidebarProps {
  view: AppView;
  onNavigate: (view: AppView) => void;
}

export function Sidebar({ view, onNavigate }: SidebarProps) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { theme, toggle } = useTheme();

  const displayName =
    user?.fullName ??
    user?.firstName ??
    user?.primaryEmailAddress?.emailAddress ??
    "Signed in";

  return (
    <aside className="hidden md:flex md:w-[236px] md:shrink-0 flex-col overflow-y-auto border-r border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-5">
      <div className="flex items-center gap-2.5 px-2 pb-5">
        <Logo size={26} />
        <span className="font-display text-[19px] font-bold tracking-tight text-foreground">
          Cadence
        </span>
      </div>

      <nav className="flex flex-col gap-0.5">
        <NavItem
          icon={<CheckSquare className="size-[17px]" strokeWidth={2} />}
          label="Today"
          active={view === "today"}
          onClick={() => onNavigate("today")}
        />
        <NavItem
          icon={<ListChecks className="size-[17px]" strokeWidth={2} />}
          label="Routines"
          active={view === "routines"}
          onClick={() => onNavigate("routines")}
        />
        <NavItem
          icon={<CalendarDays className="size-[17px]" strokeWidth={2} />}
          label="History"
          active={view === "history"}
          onClick={() => onNavigate("history")}
        />
        <NavItem
          icon={<Target className="size-[17px]" strokeWidth={2} />}
          label="Goals"
          active={view === "goals"}
          onClick={() => onNavigate("goals")}
        />
        <NavItem
          icon={<BarChart3 className="size-[17px]" strokeWidth={2} />}
          label="Insights"
          active={view === "insights"}
          onClick={() => onNavigate("insights")}
        />
        <NavItem
          icon={<Settings className="size-[17px]" strokeWidth={2} />}
          label="Settings"
          active={view === "settings"}
          onClick={() => onNavigate("settings")}
        />
      </nav>

      <TodayWidget onNavigate={onNavigate} />

      <div className="flex-1" />

      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-3 rounded-[10px] px-3 py-[9px] text-[14px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-foreground transition-all duration-150"
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      >
        <span className="flex w-[18px] shrink-0 justify-center">
          {theme === "dark" ? (
            <Sun className="size-[17px]" strokeWidth={2} />
          ) : (
            <Moon className="size-[17px]" strokeWidth={2} />
          )}
        </span>
        <span className="flex-1 text-left">
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </span>
      </button>

      <div className="mt-3 flex items-center gap-2.5 border-t border-[var(--border-subtle)] pt-3.5 px-2">
        <Avatar name={displayName} src={user?.imageUrl} size={34} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-foreground leading-tight">
            {displayName}
          </div>
          <div className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
            Free plan
          </div>
        </div>
        <SignOutButton>
          <button
            type="button"
            aria-label="Sign out"
            className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-foreground transition-all duration-150"
            onClick={() => void signOut()}
          >
            <LogOut className="size-[15px]" strokeWidth={2} />
          </button>
        </SignOutButton>
      </div>
    </aside>
  );
}
