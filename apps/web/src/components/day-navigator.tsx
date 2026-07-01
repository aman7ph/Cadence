import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays } from "@cadence/shared";

import { Button } from "@/components/ui/button";

interface DayNavigatorProps {
  viewedDate: string;
  today: string;
  onChange: (date: string) => void;
}

export function DayNavigator({
  viewedDate,
  today,
  onChange,
}: DayNavigatorProps) {
  const isToday = viewedDate === today;

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onChange(addDays(viewedDate, -1))}
        aria-label="Previous day"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onChange(addDays(viewedDate, 1))}
        disabled={isToday}
        aria-label="Next day"
      >
        <ChevronRight className="size-4" />
      </Button>
      {!isToday && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(today)}
          className="ml-1"
        >
          Today
        </Button>
      )}
    </div>
  );
}
