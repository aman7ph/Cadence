import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * "Nothing here yet" — the dashed box shown in place of an empty list.
 *
 * It was written out eight times across the app in two clusters that differed
 * only in whether they sat on a card surface, which is drift rather than
 * intent: the same idiom should not gain a background depending on which page
 * you opened. The two clusters are preserved exactly as a `variant`, so this
 * change adds no visual difference.
 *
 * Mobile's equivalent is components/ui/EmptyState.tsx.
 */
export function EmptyNote({
  children,
  variant = "card",
  className,
}: {
  children: ReactNode;
  /** `card` sits on the card surface with tighter padding; `plain` is airier and transparent. */
  variant?: "card" | "plain";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "rounded-md border border-dashed border-[var(--border-subtle)] text-center text-[13px] text-[var(--text-tertiary)]",
        variant === "card" ? "bg-card px-4 py-8" : "py-10",
        className,
      )}
    >
      {children}
    </p>
  );
}
