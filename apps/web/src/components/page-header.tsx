import { Button } from "@/components/ui/button";

export interface PageTab<T extends string> {
  id: T;
  label: string;
  count?: number;
}

interface PageHeaderProps<T extends string> {
  title: string;
  subtitle?: string;
  tabs?: PageTab<T>[];
  active?: T;
  onTabChange?: (id: T) => void;
}

/**
 * Page title, subtitle and the tab row — the shape every page in the redesign
 * shares (Routines, Staging, Goals). One component so the seven pages cannot
 * drift on heading size or tab treatment.
 *
 * Tabs use the `tab` variant (9px, no border), which the prototype keeps
 * distinct from the bordered 20px `segment` pills used inside forms.
 */
export function PageHeader<T extends string>({
  title,
  subtitle,
  tabs,
  active,
  onTabChange,
}: PageHeaderProps<T>) {
  return (
    <header className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-[23px] font-semibold leading-tight tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-[12.5px] text-[var(--text-secondary)]">{subtitle}</p>
        )}
      </div>

      {tabs && tabs.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {tabs.map((t) => (
            <Button
              key={t.id}
              variant="tab"
              selected={active === t.id}
              onClick={() => onTabChange?.(t.id)}
              aria-pressed={active === t.id}
            >
              {t.label}
              {t.count !== undefined && (
                <span className="tabular-nums opacity-70">{t.count}</span>
              )}
            </Button>
          ))}
        </div>
      )}
    </header>
  );
}
