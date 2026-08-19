import { Badge } from "@/components/ui/badge";
import { DayNavigator } from "@/components/day-navigator";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function prettyDate(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

interface TodayHeaderProps {
  viewedDate: string;
  today: string;
  isPast: boolean;
  firstName: string;
  onChange: (date: string) => void;
}

/**
 * The greeting and the day navigator.
 *
 * On a past day the greeting is replaced by the date, with a badge saying so —
 * "Good morning" on a Tuesday you are reviewing on Friday would be a lie.
 */
export function TodayHeader({
  viewedDate,
  today,
  isPast,
  firstName,
  onChange,
}: TodayHeaderProps) {
  return (
    <header className="flex items-end justify-between gap-4 flex-wrap">
      <div>
        {isPast ? (
          <Badge tone="neutral" className="mb-1.5">
            Viewing past day
          </Badge>
        ) : (
          <p className="text-[12px] text-[var(--text-secondary)]">
            {prettyDate(viewedDate)}
          </p>
        )}
        <h1 className="font-display text-[23px] font-semibold leading-[1.2] tracking-tight text-foreground mt-0.5">
          {isPast ? prettyDate(viewedDate) : `${greeting()}, ${firstName}.`}
        </h1>
      </div>
      <DayNavigator viewedDate={viewedDate} today={today} onChange={onChange} />
    </header>
  );
}
