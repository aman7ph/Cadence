import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface NavItemProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  badge?: string;
  onClick?: () => void;
}

export function NavItem({ icon, label, active, disabled, badge, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded-[10px] px-3 py-[9px] text-[14px] font-semibold transition-all duration-150 w-full text-left",
        active
          ? "bg-[var(--surface-accent)] text-[var(--text-accent)]"
          : disabled
            ? "text-[var(--text-tertiary)] cursor-default opacity-50"
            : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-foreground",
      )}
    >
      {active && (
        <span className="absolute left-[3px] top-1/2 -translate-y-1/2 h-[18px] w-[3px] rounded-full bg-[var(--text-accent)]" />
      )}
      <span className="flex w-[18px] shrink-0 justify-center opacity-90">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="rounded-full bg-[var(--status-complete)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
          {badge}
        </span>
      )}
      {disabled && (
        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
          Soon
        </span>
      )}
    </button>
  );
}
