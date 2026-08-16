import { useClerk, useUser } from "@clerk/clerk-react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
    <section className="flex flex-col gap-4 rounded-lg border border-[var(--border-subtle)] bg-card p-5">
      <div>
        <h2 className="font-display text-[14px] font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--text-tertiary)]">
            {description}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
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
          <div className="truncate text-[13.5px] font-semibold leading-snug text-foreground">{displayName}</div>
          {email && <div className="mt-0.5 truncate text-[12px] text-[var(--text-secondary)]">{email}</div>}
        </div>
      </div>
      <div className="border-t border-[var(--border-subtle)] pt-4">
        <Button variant="danger" size="sm" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
    </Section>
  );
}

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
  { value: "light",  label: "Light",  icon: <Sun     className="size-[15px]" strokeWidth={2} /> },
  { value: "dark",   label: "Dark",   icon: <Moon    className="size-[15px]" strokeWidth={2} /> },
  { value: "system", label: "System", icon: <Monitor className="size-[15px]" strokeWidth={2} /> },
];

export function AppearanceSection() {
  const { preference, setTheme } = useTheme();
  return (
    <Section title="Appearance" description="Choose how Cadence looks. System follows your OS setting automatically.">
      <div className="flex flex-col">
        {THEME_OPTIONS.map((opt) => {
          const isActive = preference === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={cn(
                "flex items-center gap-2.5 rounded-sm px-2 py-2 text-left text-[12px] font-semibold transition-colors duration-150",
                isActive
                  ? "text-[var(--text-accent)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-foreground",
              )}
              aria-pressed={isActive}
            >
              <span className="flex w-[18px] justify-center">{opt.icon}</span>
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
        <span className="font-mono text-[13px] text-foreground bg-[var(--bg-sunken)] rounded-sm px-2.5 py-1">
          {timezone}
        </span>
      </FieldRow>
    </Section>
  );
}
