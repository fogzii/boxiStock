"use client";

import * as React from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { cn } from "@/lib/utils";

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

export function ProfitChart({ className, weeklyData, monthlyData, allTimeData }: ProfitChartProps) {
  const [mode, setMode] = React.useState<Mode>("weekly");

  const chartData = mode === "weekly" ? weeklyData : mode === "monthly" ? monthlyData : allTimeData;

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
          <h4 className="text-xl font-bold text-foreground">
            Profit Over Time
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-muted-foreground text-sm">
              {modeLabels[mode].sublabel}
            </span>
          </div>
        </div>
        <div className="flex bg-primary/5 p-1 rounded-lg border border-primary/10 w-full sm:w-auto">
          {(Object.keys(modeLabels) as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 px-4 py-1.5 whitespace-nowrap rounded-md text-xs font-bold transition-colors cursor-pointer",
                mode === m
                  ? "bg-primary text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {modeLabels[m].label}
            </button>
          ))}
        </div>
      </div>

      {/* Container needs a fixed height so Recharts can be responsive */}
      <div className="relative h-[300px] sm:h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9180a8" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#9180a8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              padding={{ left: 10, right: 10 }}
              interval="preserveStartEnd"
            />
            <Tooltip
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border border-border p-3 rounded-xl shadow-xl">
                      <p className="text-sm font-bold text-foreground">
                        {payload[0].payload.name}
                      </p>
                      <p className="text-sm text-primary font-bold">
                        {formatter.format(payload[0].value)}
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
              stroke="#9180a8"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorProfit)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
