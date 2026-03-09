"use client";

import * as React from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { cn } from "@/lib/utils";

const data = [
  { name: "Jan", total: 1200 },
  { name: "Feb", total: 2100 },
  { name: "Mar", total: 1800 },
  { name: "Apr", total: 2400 },
  { name: "May", total: 2000 },
  { name: "Jun", total: 3200 },
  { name: "Jul", total: 2900 },
  { name: "Aug", total: 3800 },
  { name: "Sep", total: 3400 },
  { name: "Oct", total: 4200 },
  { name: "Nov", total: 3900 },
  { name: "Dec", total: 4800 },
];

export function ProfitChart({ className }: { className?: string }) {
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
              Last 12 Months
            </span>
          </div>
        </div>
        <div className="flex bg-primary/5 p-1 rounded-lg border border-primary/10 w-full sm:w-auto">
          <button className="flex-1 px-4 py-1.5 rounded-md text-xs font-bold bg-primary text-background shadow-sm">
            Yearly
          </button>
          <button className="flex-1 px-4 py-1.5 rounded-md text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
            Monthly
          </button>
        </div>
      </div>

      {/* Container needs a fixed height so Recharts can be responsive */}
      <div className="relative h-[300px] sm:h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
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
