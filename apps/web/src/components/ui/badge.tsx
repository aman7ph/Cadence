import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium leading-tight whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral:
          "bg-[var(--surface-active)] text-[var(--text-secondary)] border border-border",
        accent:
          "bg-[var(--surface-accent)] text-[var(--text-accent)] border border-[var(--indigo-100)]",
        success:
          "bg-[var(--green-50)] text-[var(--green-700)] border border-[var(--green-100)]",
        carryover:
          "bg-[var(--amber-50)] text-[var(--amber-600)] border border-[var(--amber-100)]",
        danger:
          "bg-[var(--red-50)] text-[var(--red-600)] border border-[var(--red-100)]",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { Badge, badgeVariants };
