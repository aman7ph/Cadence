import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

/**
 * Lives in the shell's top-right, matching the prototype — which puts it in the
 * page header rather than the sidebar footer where it used to sit.
 *
 * Rendered once by the shell instead of by each of the seven pages: same
 * control, one definition.
 */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-active)] text-[var(--text-secondary)] transition-colors hover:text-foreground"
    >
      {theme === "dark" ? (
        <Sun className="size-[15px]" strokeWidth={2} />
      ) : (
        <Moon className="size-[15px]" strokeWidth={2} />
      )}
    </button>
  );
}
