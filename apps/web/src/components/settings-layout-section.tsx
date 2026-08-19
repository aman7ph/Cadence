import {
  LIST_PAGES,
  MAX_LIST_COLUMNS,
  MIN_LIST_COLUMNS,
  type ListPage,
} from "@cadence/shared";
import { Button } from "@/components/ui/button";
import { useListColumns } from "@/lib/use-list-columns";
import { Section } from "./settings-section";

const PAGE_LABEL: Record<ListPage, string> = {
  today: "Today",
  routines: "Routines",
  staging: "Staging",
  goals: "Goals",
};

// Each value covers every tab on its page (D16) — saying so here is cheaper
// than a user discovering it by switching tabs and finding nothing changed.
const PAGE_HINT: Record<ListPage, string> = {
  today: "Routines and tasks",
  routines: "Active and archived",
  staging: "Unscheduled and scheduled",
  goals: "Active, completed and abandoned",
};

const CHOICES = Array.from(
  { length: MAX_LIST_COLUMNS - MIN_LIST_COLUMNS + 1 },
  (_, i) => MIN_LIST_COLUMNS + i,
);

export function LayoutSection() {
  const { columns, ready, setColumns } = useListColumns();

  return (
    <Section
      title="List layout"
      description="How many columns each page lists items in. Narrow screens always use one column."
    >
      <div className="flex flex-col gap-3.5">
        {LIST_PAGES.map((page) => (
          <div
            key={page}
            className="flex flex-wrap items-center justify-between gap-2"
          >
            <span className="flex min-w-0 flex-col">
              <span className="text-[12.5px] font-semibold text-foreground">
                {PAGE_LABEL[page]}
              </span>
              <span className="text-[11px] text-[var(--text-tertiary)]">
                {PAGE_HINT[page]}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              {CHOICES.map((n) => (
                <Button
                  key={n}
                  variant="segment"
                  size="sm"
                  selected={columns[page] === n}
                  disabled={!ready}
                  aria-label={`${PAGE_LABEL[page]}: ${n} column${n === 1 ? "" : "s"}`}
                  onClick={() => setColumns(page, n)}
                >
                  {n}
                </Button>
              ))}
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}
