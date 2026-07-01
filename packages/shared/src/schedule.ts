import { weekdayOf } from "./date";

export type Schedule = {
  scheduleType: "daily" | "weekdays" | "custom";
  customDays?: number[];
  createdDate: string;
  archivedDate?: string;
};

export function isScheduledOn(schedule: Schedule, date: string): boolean {
  if (date < schedule.createdDate) return false;
  if (schedule.archivedDate && date > schedule.archivedDate) return false;
  switch (schedule.scheduleType) {
    case "daily":
      return true;
    case "weekdays": {
      const dow = weekdayOf(date);
      return dow >= 1 && dow <= 5;
    }
    case "custom":
      return schedule.customDays?.includes(weekdayOf(date)) ?? false;
  }
}
