import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Drawer, type DrawerSize } from "@/components/ui/drawer";

interface FormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  submitLabel: string;
  /** `danger` for destructive confirms — same chrome, different CTA tone. */
  tone?: "accent" | "danger";
  submitDisabled?: boolean;
  /** Defaults to `form`; confirms pass `confirm`. */
  size?: DrawerSize;
  onSubmit: () => void | Promise<void>;
  children: ReactNode;
}

/**
 * The chrome every create / edit / delete shares: a right-hand drawer with a
 * title, a scrolling body and a Cancel / CTA footer (D17).
 *
 * Forms supply only their fields. Pending state, Enter-to-submit and closing on
 * success live here so no page reimplements them — and so a destructive confirm
 * cannot drift from a create form, since it is the same component with a
 * different CTA tone.
 */
export function FormDrawer({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  tone = "accent",
  submitDisabled,
  size,
  onSubmit,
  children,
}: FormDrawerProps) {
  const [pending, setPending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (pending || submitDisabled) return;
    setPending(true);
    try {
      await onSubmit();
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      label={title}
      size={size}
    >
      <form onSubmit={submit} className="flex min-h-full flex-col">
        <div className="px-7 pb-4 pt-6">
          <h2 className="font-display text-[20px] font-semibold leading-tight text-foreground">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-[12px] text-[var(--text-secondary)]">{description}</p>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-4 px-7 pb-4">{children}</div>

        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-[var(--border-subtle)] bg-[var(--bg-app)] px-7 py-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant={tone === "danger" ? "outline" : "solid"}
            tone={tone === "danger" ? "danger" : "neutral"}
            size="sm"
            disabled={pending || submitDisabled}
          >
            {pending ? "Saving…" : submitLabel}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
