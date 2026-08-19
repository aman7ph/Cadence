import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Static class map — NOT `grid-cols-${n}`.
 *
 * Tailwind scans source text, so an interpolated class name produces no rule at
 * all. This is written out for the same reason the radius row in /preview is:
 * a template there only worked by coincidence, because those classes happened
 * to exist elsewhere in the codebase.
 *
 * The stored number is a MAXIMUM, applied at the widest breakpoint. Five
 * columns of task rows at 375px would be unreadable, so every count renders one
 * column on narrow screens and at most two until `lg`.
 */
const COLUMN_CLASS: Record<number, string> = {
  1: "grid-cols-1",
  // 2 deliberately waits for `lg`, matching what Routines and Staging shipped
  // with. Going to two columns at `sm` would give ~300px per row and, more
  // importantly, would change those pages at medium widths for users who never
  // touched the setting — breaking the guarantee that the defaults render
  // exactly as before.
  2: "grid-cols-1 lg:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
};

interface ListGridProps {
  /** Columns at `lg` and above; 1–5. Out-of-range values fall back to 1. */
  columns: number;
  className?: string;
  children: ReactNode;
}

/**
 * The one grid every list page uses (Today, Routines, Staging, Goals). Six call
 * sites share it so a breakpoint change lands everywhere at once.
 */
export function ListGrid({ columns, className, children }: ListGridProps) {
  return (
    <div
      className={cn(
        "grid gap-2",
        COLUMN_CLASS[columns] ?? COLUMN_CLASS[1],
        className,
      )}
    >
      {children}
    </div>
  );
}
