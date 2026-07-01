import { useState } from "react";
import { formatDateShort, type DateRange } from "@cadence/shared";
import { cn } from "@/lib/utils";
import { PRESETS } from "./date-range-picker-presets";
import type { Preset } from "./date-range-picker-presets";

interface DateRangePickerPanelProps {
  value: DateRange;
  today: string;
  activePresetLabel: string | undefined;
  onPreset: (range: DateRange, label: string) => void;
  onApply: (range: DateRange, label: string) => void;
  onClose: () => void;
}

export function DateRangePickerPanel({
  value,
  today,
  activePresetLabel,
  onPreset,
  onApply,
}: DateRangePickerPanelProps) {
  const [customFrom, setCustomFrom] = useState(value.from);
  const [customTo, setCustomTo] = useState(value.to);
  const [customError, setCustomError] = useState<string | null>(null);

  const handleApply = () => {
    if (!customFrom || !customTo) {
      setCustomError("Both dates are required.");
      return;
    }
    if (customFrom > customTo) {
      setCustomError("Start date must be on or before end date.");
      return;
    }
    if (customTo > today) {
      setCustomError("End date cannot be in the future.");
      return;
    }
    const label = `${formatDateShort(customFrom)} – ${formatDateShort(customTo)}`;
    onApply({ from: customFrom, to: customTo }, label);
  };

  return (
    <div
      className="absolute left-0 top-full mt-2 z-20 flex rounded-lg border border-border bg-card shadow-[var(--shadow-md)] overflow-hidden"
      style={{ minWidth: 420 }}
    >
      {/* Left: preset list */}
      <div className="flex flex-col border-r border-border py-2 min-w-[160px]">
        <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.10em] text-muted-foreground">
          Presets
        </p>
        {PRESETS.map((preset: Preset) => {
          const isActive = activePresetLabel === preset.label;
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                const range = preset.range(today);
                onPreset(range, preset.label);
              }}
              className={cn(
                "px-3 py-1.5 text-left text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--surface-accent)] text-[var(--text-accent)]"
                  : "text-foreground hover:bg-[var(--surface-hover)]",
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Right: custom range */}
      <div className="flex flex-col gap-3 p-4 min-w-[220px]">
        <p className="text-[10px] font-bold uppercase tracking-[0.10em] text-muted-foreground">
          Custom range
        </p>
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground">From</span>
            <input
              type="date"
              value={customFrom}
              max={customTo || today}
              onChange={(e) => { setCustomFrom(e.target.value); setCustomError(null); }}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--text-accent)]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground">To</span>
            <input
              type="date"
              value={customTo}
              min={customFrom}
              max={today}
              onChange={(e) => { setCustomTo(e.target.value); setCustomError(null); }}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--text-accent)]"
            />
          </label>
        </div>
        {customError && <p className="text-xs text-red-500">{customError}</p>}
        <button
          type="button"
          onClick={handleApply}
          className="rounded-md bg-[var(--surface-accent)] px-3 py-1.5 text-sm font-semibold text-[var(--text-accent)] hover:opacity-90 transition-opacity"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
