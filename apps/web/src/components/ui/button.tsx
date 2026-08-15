import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * One button, six treatments — variants are props, never separate components.
 *
 * Every value below is measured from the redesign prototype (see
 * .agent/design/harness/measure.mjs), not taken from the handoff prose, which
 * describes four families and gets two of them wrong.
 *
 *   solid    accent CTA — Add, Save changes, Create goal
 *   ghost    plain-text secondary — Cancel, Close
 *   danger   plain-text destructive — Sign out, Delete
 *   outline  bordered action — Edit, Mark complete, Abandon (tone-able)
 *   segment  20px pill in a segmented control — Daily/Weekdays/Custom, tabs
 *   block    full-width bordered add-row — "+ New routine"
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-150 disabled:opacity-45 disabled:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        solid:
          "rounded-sm bg-[var(--action-primary)] text-[var(--text-on-accent)] shadow-[var(--shadow-accent)] hover:bg-[var(--action-primary-hover)] active:scale-[0.97]",
        ghost:
          "rounded-sm bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
        danger:
          "rounded-sm bg-transparent text-[var(--status-danger)] hover:opacity-80",
        outline:
          "rounded-sm border bg-transparent active:scale-[0.97]",
        segment:
          "rounded-pill border font-semibold",
        // Page-level tabs (Active/Archived, Unscheduled/Scheduled). Measured
        // r=9 with NO border — distinct from `segment`, which is the bordered
        // 20px pill used inside forms.
        tab: "rounded-sm font-semibold",
        block:
          "w-full rounded-md border border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--border-default)] hover:text-[var(--text-primary)]",
      },
      /** Colour of `outline` — the prototype tones Mark complete green. */
      tone: {
        neutral: "",
        success: "",
        danger: "",
      },
      /** Selected state of `segment`. */
      selected: { true: "", false: "" },
      size: {
        sm: "px-3.5 py-[6px] text-[11.5px] [&_svg]:size-3.5",
        md: "px-4 py-[7px] text-[12px] [&_svg]:size-4",
        lg: "px-4 py-[9px] text-[13px] [&_svg]:size-4",
        icon: "p-2 [&_svg]:size-4",
      },
    },
    compoundVariants: [
      {
        variant: "outline",
        tone: "neutral",
        className:
          "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-default)] hover:text-[var(--text-primary)]",
      },
      {
        variant: "outline",
        tone: "success",
        className:
          "border-[var(--status-complete)] text-[var(--status-complete)] hover:bg-[var(--surface-success)]",
      },
      {
        variant: "outline",
        tone: "danger",
        className:
          "border-[var(--status-danger)] text-[var(--status-danger)] hover:bg-[var(--surface-danger)]",
      },
      {
        variant: "segment",
        selected: true,
        className:
          "border-[var(--border-accent)] bg-[var(--surface-accent)] text-[var(--text-accent)]",
      },
      {
        variant: "tab",
        selected: true,
        className: "bg-[var(--surface-accent)] text-[var(--text-accent)]",
      },
      {
        variant: "tab",
        selected: false,
        className:
          "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
      },
      {
        variant: "segment",
        selected: false,
        className:
          "border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
      },
      // Plain-text treatments carry no box, so horizontal padding would only
      // push them away from their neighbours.
      { variant: ["ghost", "danger"], className: "px-1" },
    ],
    defaultVariants: {
      variant: "solid",
      tone: "neutral",
      selected: false,
      size: "md",
    },
  },
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, tone, selected, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, tone, selected, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };
