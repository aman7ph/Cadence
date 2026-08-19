import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import type { ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Section } from "./settings-section";

// The three-way preference, as distinct from the toggle in the sidebar, which
// flips between resolved light and dark. "System" is only reachable here.
const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "light",
    label: "Light",
    icon: <Sun className="size-[15px]" strokeWidth={2} />,
  },
  {
    value: "dark",
    label: "Dark",
    icon: <Moon className="size-[15px]" strokeWidth={2} />,
  },
  {
    value: "system",
    label: "System",
    icon: <Monitor className="size-[15px]" strokeWidth={2} />,
  },
];

export function AppearanceSection() {
  const { preference, setTheme } = useTheme();
  return (
    <Section
      title="Appearance"
      description="Choose how Cadence looks. System follows your OS setting automatically."
    >
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
