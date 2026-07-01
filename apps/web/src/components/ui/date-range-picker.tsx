import { useEffect, useState } from "react";
import { CalendarRange } from "lucide-react";
import type { DateRange } from "@cadence/shared";
import { DateRangePickerPanel } from "./date-range-picker-panel";
import { PRESETS } from "./date-range-picker-presets";

export type { DateRange };

export interface DateRangePickerProps {
  value: DateRange;
  label: string;
  today: string;
  onChange: (range: DateRange, label: string) => void;
}

export function DateRangePicker({ value, label, today, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const activePreset = PRESETS.find((p) => {
    const r = p.range(today);
    return r.from === value.from && r.to === value.to;
  });

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-[var(--surface-hover)] transition-colors"
      >
        <CalendarRange className="size-4 shrink-0 text-muted-foreground" />
        <span>{label}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <DateRangePickerPanel
            value={value}
            today={today}
            activePresetLabel={activePreset?.label}
            onPreset={(range, lbl) => { onChange(range, lbl); setOpen(false); }}
            onApply={(range, lbl) => { onChange(range, lbl); setOpen(false); }}
            onClose={() => setOpen(false)}
          />
        </>
      )}
    </div>
  );
}
