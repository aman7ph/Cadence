import * as React from "react";
import { ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  { label: string; color?: string }
>;

interface ChartContextValue {
  config: ChartConfig;
}

const ChartContext = React.createContext<ChartContextValue>({
  config: {},
});

export function ChartContainer({
  config,
  children,
  className,
}: {
  config: ChartConfig;
  children: React.ReactElement;
  className?: string;
}) {
  const cssVars = Object.fromEntries(
    Object.entries(config).map(([key, val]) => [
      `--color-${key}`,
      val.color ?? `var(--chart-1)`,
    ]),
  ) as React.CSSProperties;

  return (
    <ChartContext.Provider value={{ config }}>
      <div className={cn("w-full", className)} style={cssVars}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export function useChartConfig() {
  return React.useContext(ChartContext);
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>;
  label?: string;
  labelFormatter?: (label: string) => string;
  formatter?: (value: number, name: string) => [string, string];
}) {
  const { config } = useChartConfig();
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-[var(--shadow-md)] text-[13px]">
      {label && (
        <p className="mb-1.5 font-medium text-foreground">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <div className="flex flex-col gap-1">
        {payload.map((item) => {
          const cfg = config[item.dataKey];
          const [displayValue, displayName] = formatter
            ? formatter(item.value, item.name)
            : [String(item.value), cfg?.label ?? item.name];
          return (
            <div key={item.dataKey} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ background: item.color }}
              />
              <span className="text-muted-foreground">{displayName}</span>
              <span className="ml-auto pl-4 font-mono font-medium text-foreground">
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { Tooltip as ChartTooltip };
