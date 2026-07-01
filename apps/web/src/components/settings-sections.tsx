import { useClerk, useUser } from "@clerk/clerk-react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useTheme } from "@/lib/theme";
import type { ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[16px] border border-[var(--border-subtle)] bg-card shadow-[var(--shadow-sm)] overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
        <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-[12px] text-[var(--text-tertiary)] mt-1 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="p-5 flex flex-col gap-4">{children}</div>
    </section>
  );
}

export function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[13px] font-medium text-[var(--text-secondary)] shrink-0">{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

export function AccountSection() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const displayName = user?.fullName ?? user?.firstName ?? user?.primaryEmailAddress?.emailAddress ?? "Signed in";
  const email = user?.primaryEmailAddress?.emailAddress;

  return (
    <Section title="Account">
      <div className="flex items-center gap-4">
        <Avatar name={displayName} src={user?.imageUrl} size={52} />
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-foreground truncate leading-snug">{displayName}</div>
          {email && <div className="text-[13px] text-[var(--text-secondary)] truncate mt-0.5">{email}</div>}
        </div>
      </div>
      <div className="border-t border-[var(--border-subtle)] pt-4">
        <button
          type="button"
          onClick={() => void signOut()}
          className="text-[13px] font-semibold text-[var(--text-secondary)] hover:text-[var(--status-danger)] underline underline-offset-2 transition-colors duration-150"
        >
          Sign out
        </button>
      </div>
    </Section>
  );
}

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
  { value: "light",  label: "Light",  icon: <Sun     className="size-[18px]" strokeWidth={2} /> },
  { value: "dark",   label: "Dark",   icon: <Moon    className="size-[18px]" strokeWidth={2} /> },
  { value: "system", label: "System", icon: <Monitor className="size-[18px]" strokeWidth={2} /> },
];

export function AppearanceSection() {
  const { preference, setTheme } = useTheme();
  return (
    <Section title="Appearance" description="Choose how Cadence looks. System follows your OS setting automatically.">
      <div className="flex gap-2.5">
        {THEME_OPTIONS.map((opt) => {
          const isActive = preference === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={cn(
                "flex flex-1 flex-col items-center gap-2.5 rounded-[12px] border py-4 px-2 text-[13px] font-semibold transition-all duration-150",
                isActive
                  ? "border-[var(--border-accent)] bg-[var(--surface-accent)] text-[var(--text-accent)] shadow-[0_0_0_1px_var(--border-accent)]"
                  : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-foreground hover:border-[var(--border-default)]",
              )}
              aria-pressed={isActive}
            >
              {opt.icon}
              {opt.label}
            </button>
          );
        })}
      </div>
    </Section>
  );
}

export function DataSection() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (
    <Section title="Data" description="Information about how your data is stored and processed.">
      <FieldRow label="Detected timezone">
        <span className="font-mono text-[13px] text-foreground bg-[var(--bg-sunken)] rounded-[8px] px-2.5 py-1">
          {timezone}
        </span>
      </FieldRow>
    </Section>
  );
}
