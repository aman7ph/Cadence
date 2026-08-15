import { cn } from "@/lib/utils";

/**
 * "ROUTINES · 3/11" — the section heading used across every page.
 *
 * Measured from the prototype: Lora, 11px, regular weight, 0.55px tracking,
 * with the count inline after a middot rather than pushed to the right. One
 * component so seven pages cannot drift apart.
 */
export function SectionLabel({
  children,
  count,
  className,
}: {
  children: React.ReactNode;
  count?: string;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "font-display text-[11px] uppercase tracking-[0.05em] text-[var(--text-tertiary)]",
        className,
      )}
    >
      {children}
      {count ? <span className="tabular-nums"> · {count}</span> : null}
    </h2>
  );
}
