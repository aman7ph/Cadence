import { useClerk, useUser, SignOutButton } from "@clerk/clerk-react";
import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  Inbox,
  ListChecks,
  LogOut,
  Settings,
  Target,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import type { AppView } from "@/App";
import { NavItem } from "./sidebar-nav-item";

/**
 * The navigation, defined once and rendered by both the desktop sidebar and the
 * mobile drawer. Two copies would drift the first time an item is added.
 */
export const NAV_ITEMS: { view: AppView; label: string; icon: React.ReactNode }[] = [
  { view: "today", label: "Today", icon: <CheckSquare className="size-[17px]" strokeWidth={2} /> },
  { view: "routines", label: "Routines", icon: <ListChecks className="size-[17px]" strokeWidth={2} /> },
  { view: "staging", label: "Staging", icon: <Inbox className="size-[17px]" strokeWidth={2} /> },
  { view: "history", label: "History", icon: <CalendarDays className="size-[17px]" strokeWidth={2} /> },
  { view: "goals", label: "Goals", icon: <Target className="size-[17px]" strokeWidth={2} /> },
  { view: "insights", label: "Insights", icon: <BarChart3 className="size-[17px]" strokeWidth={2} /> },
  { view: "settings", label: "Settings", icon: <Settings className="size-[17px]" strokeWidth={2} /> },
];

interface SidebarNavProps {
  view: AppView;
  onNavigate: (view: AppView) => void;
}

export function SidebarNav({ view, onNavigate }: SidebarNavProps) {
  const { user } = useUser();
  const { signOut } = useClerk();

  const displayName =
    user?.fullName ??
    user?.firstName ??
    user?.primaryEmailAddress?.emailAddress ??
    "Signed in";

  return (
    <>
      <div className="flex items-center gap-2.5 px-2 pb-5">
        <Logo size={26} />
        <span className="font-display text-[19px] font-semibold tracking-tight text-foreground">
          Cadence
        </span>
      </div>

      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.view}
            icon={item.icon}
            label={item.label}
            active={view === item.view}
            onClick={() => onNavigate(item.view)}
          />
        ))}
      </nav>

      <div className="flex-1" />

      <div className="mt-3 flex items-center gap-2.5 border-t border-[var(--border-subtle)] px-2 pt-3.5">
        <Avatar name={displayName} src={user?.imageUrl} size={32} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold leading-tight text-foreground">
            {displayName}
          </div>
        </div>
        <SignOutButton>
          <button
            type="button"
            aria-label="Sign out"
            className="flex h-7 w-7 items-center justify-center rounded-sm text-[var(--text-tertiary)] transition-all duration-150 hover:bg-[var(--surface-hover)] hover:text-foreground"
            onClick={() => void signOut()}
          >
            <LogOut className="size-[15px]" strokeWidth={2} />
          </button>
        </SignOutButton>
      </div>
    </>
  );
}
