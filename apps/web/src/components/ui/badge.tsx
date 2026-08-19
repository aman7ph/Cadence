import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Tones are props on one Badge. Every colour resolves through the semantic
 * layer — no component reaches into the raw palette (see styles/palette.css).
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-pill border px-2.5 py-0.5 text-xs font-medium leading-tight whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral:
          "border-[var(--border-subtle)] bg-[var(--surface-active)] text-[var(--text-secondary)]",
        accent:
          "border-[var(--border-accent)] bg-[var(--surface-accent)] text-[var(--text-accent)]",
        success:
          "border-[var(--status-complete)] bg-[var(--surface-success)] text-[var(--text-success)]",
        // Neutral by design: a carried task should read as quiet, not as a
        // warning, and amber would collide with the gold accent. See Step 2.
        carryover:
          "border-transparent bg-[var(--surface-accent)] text-[var(--status-carryover)]",
        danger:
          "border-[var(--status-danger)] bg-[var(--surface-danger)] text-[var(--status-danger)]",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { Badge, badgeVariants };
