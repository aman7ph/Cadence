import { addDays, startOfMonth, startOfWeek, startOfYear } from "@cadence/shared";
import type { DateRange } from "@cadence/shared";

export interface Preset {
  label: string;
  range: (today: string) => DateRange;
}

export const PRESETS: Preset[] = [
  { label: "Last 7 days",   range: (t) => ({ from: addDays(t, -6),   to: t }) },
  { label: "Last 30 days",  range: (t) => ({ from: addDays(t, -29),  to: t }) },
  { label: "Last 90 days",  range: (t) => ({ from: addDays(t, -89),  to: t }) },
  { label: "Last 6 months", range: (t) => ({ from: addDays(t, -181), to: t }) },
  { label: "Last year",     range: (t) => ({ from: addDays(t, -364), to: t }) },
  { label: "This week",     range: (t) => ({ from: startOfWeek(t),   to: t }) },
  { label: "This month",    range: (t) => ({ from: startOfMonth(t),  to: t }) },
  { label: "This year",     range: (t) => ({ from: startOfYear(t),   to: t }) },
  { label: "All time",      range: (t) => ({ from: "2020-01-01",     to: t }) },
];
