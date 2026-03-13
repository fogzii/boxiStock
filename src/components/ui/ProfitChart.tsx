"use client";

import * as React from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { cn } from "@/lib/utils";

const weeklyData = [
  { name: "W1", total: 820 },
  { name: "W2", total: 1040 },
  { name: "W3", total: 1320 },
  { name: "W4", total: 1180 },
  { name: "W5", total: 1460 },
  { name: "W6", total: 1720 },
  { name: "W7", total: 1610 },
  { name: "W8", total: 1890 },
];

const monthlyData = [
  { name: "Jan", total: 3200 },
  { name: "Feb", total: 2900 },
  { name: "Mar", total: 3400 },
  { name: "Apr", total: 3600 },
  { name: "May", total: 3800 },
  { name: "Jun", total: 4100 },
  { name: "Jul", total: 4300 },
  { name: "Aug", total: 4500 },
  { name: "Sep", total: 4700 },
  { name: "Oct", total: 4900 },
  { name: "Nov", total: 5100 },
  { name: "Dec", total: 5400 },
];

export function ProfitChart({ className }: { className?: string }) {
  const [mode, setMode] = React.useState<"weekly" | "monthly">("weekly");
  const chartData = mode === "weekly" ? weeklyData : monthlyData;

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
              {mode === "weekly" ? "Last 8 Weeks" : "Last 12 Months"}
            </span>
          </div>
        </div>
        <div className="flex bg-primary/5 p-1 rounded-lg border border-primary/10 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setMode("weekly")}
            className={cn(
              "flex-1 px-4 py-1.5 rounded-md text-xs font-bold transition-colors",
              mode === "weekly"
                ? "bg-primary text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Weekly
          </button>
          <button
            type="button"
            onClick={() => setMode("monthly")}
            className={cn(
              "flex-1 px-4 py-1.5 rounded-md text-xs font-bold transition-colors",
              mode === "monthly"
                ? "bg-primary text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Monthly
          </button>
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
              tickFormatter={(value: string, index: number) => {
                // Only show odd index labels or specific ones on small screens if desired
                return value;
              }}
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
                        ${payload[0].value}
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
