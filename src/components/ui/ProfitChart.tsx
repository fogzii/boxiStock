"use client";

import { SegmentedControl, ToggleSwitch } from "@box-ds";
import * as React from "react";
import { Area, AreaChart, Tooltip, XAxis } from "recharts";
import { cn } from "@/lib/utils";

/**
 * Measure a DOM element's size. We size the chart ourselves (instead of using
 * Recharts' <ResponsiveContainer />) so that the chart only renders once a
 * real, positive size is available — this avoids the repeated
 * `width(-1)/height(-1)` warnings Recharts logs when its own measurement pass
 * runs before the browser has laid the element out.
 */
function useElementSize<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null);
  const [size, setSize] = React.useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
}

type ChartPoint = { name: string; total: number };

interface ProfitChartProps {
  className?: string;
  weeklyData: ChartPoint[];
  monthlyData: ChartPoint[];
  allTimeData: ChartPoint[];
}

type Mode = "weekly" | "monthly" | "alltime";

const modeLabels: Record<Mode, { label: string; sublabel: string }> = {
  weekly: { label: "Weekly", sublabel: "Last 8 Weeks" },
  monthly: { label: "Monthly", sublabel: "Last 12 Months" },
  alltime: { label: "All Time", sublabel: "Entire History" },
};

const modeTabs = (Object.keys(modeLabels) as Mode[]).map((mode) => ({
  value: mode,
  label: modeLabels[mode].label,
}));

export function ProfitChart({
  className,
  weeklyData,
  monthlyData,
  allTimeData,
}: ProfitChartProps) {
  const [mode, setMode] = React.useState<Mode>("weekly");
  const [isCumulative, setIsCumulative] = React.useState(false);
  const [chartContainerRef, { width, height }] =
    useElementSize<HTMLDivElement>();
  const hasSize = width > 0 && height > 0;

  const rawData =
    mode === "weekly"
      ? weeklyData
      : mode === "monthly"
        ? monthlyData
        : allTimeData;

  const chartData = React.useMemo(() => {
    if (!isCumulative) return rawData;
    let runningTotal = 0;
    return rawData.map((point) => {
      runningTotal += point.total;
      return { ...point, total: runningTotal };
    });
  }, [rawData, isCumulative]);

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  return (
    <div
      className={cn(
        "bg-primary/5 border border-primary/10 rounded-2xl p-4 sm:p-8",
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h4 className="font-display text-display-xs text-foreground">
            Profit Over Time
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-muted-foreground text-body-sm">
              {modeLabels[mode].sublabel}
            </span>
          </div>
        </div>
        {/* wrap-reverse stacks wrapped lines bottom-up, so when Cumulative no
            longer fits beside the mode switcher it drops below it rather than
            sitting on top. On a single line the order is unchanged. */}
        <div className="flex flex-row flex-wrap-reverse items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <ToggleSwitch
            checked={isCumulative}
            onCheckedChange={setIsCumulative}
            label="Cumulative"
            size="lg"
            // The switch sizes to its own content here; `w-full` is only right
            // for the form rows the default targets.
            className="w-auto"
          />
          <SegmentedControl
            ariaLabel="Chart range"
            items={modeTabs}
            value={mode}
            onChange={setMode}
          />
        </div>
      </div>

      {/* Container has a fixed height; we measure its size ourselves and only
          render the chart once we have a real, positive width and height. */}
      <div
        ref={chartContainerRef}
        className="relative h-[300px] sm:h-[400px] w-full"
      >
        {hasSize ? (
          <AreaChart
            width={width}
            height={height}
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-primary)"
                  stopOpacity={0.5}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-primary)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              stroke="var(--color-mute)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              padding={{ left: 10, right: 10 }}
              interval="preserveStartEnd"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  const first = payload[0];
                  const name = (first.payload as { name?: string } | undefined)
                    ?.name;
                  const value = Number(first.value ?? 0);
                  return (
                    <div className="bg-background border border-border p-3 rounded-xl shadow-xl">
                      <p className="text-body-sm-strong text-foreground">
                        {name}
                      </p>
                      <p className="text-body-sm-strong text-primary">
                        {formatter.format(value)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              className="chart-glow drop-shadow-[0_0_8px_rgba(145,128,168,0.4)]"
              type="monotone"
              dataKey="total"
              stroke="var(--color-primary)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorProfit)"
            />
          </AreaChart>
        ) : (
          <div className="h-full w-full animate-pulse rounded-xl bg-primary/5" />
        )}
      </div>
    </div>
  );
}
