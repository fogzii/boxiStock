"use client";

import {
  History,
  LayoutDashboard,
  Package,
  Percent,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import type { CombinedRow } from "@/components/sales/salesTable";
import { SalesTable } from "@/components/sales/salesTable";
import type { ProductWithLots } from "@/components/stock/stockTable";
import { StockTable } from "@/components/stock/stockTable";
import { ProfitChart } from "@/components/ui/ProfitChart";
import { StatCard } from "@/components/ui/StatCard";
import { ReadOnlyProvider } from "@/lib/context/readOnly";
import { cn } from "@/lib/utils";

type ChartPoint = { name: string; total: number };

interface ShareContentProps {
  token: string;
  sections: string[];
  dashboardMetrics: {
    totalLifetimeProfit: number;
    currentInventoryValue: number;
    currentROI: number;
  } | null;
  chartData: {
    weeklyData: ChartPoint[];
    monthlyData: ChartPoint[];
    allTimeData: ChartPoint[];
  } | null;
  inventoryProducts: ProductWithLots[];
  inventoryCount: number;
  stockCurrentPage: number;
  stockTotalPages: number;
  salesMetrics: {
    totalSalesToday: number;
    totalUnitsSoldWeek: number;
    netProfitWeek: number;
    netProfitLifetime: number;
  } | null;
  salesItems: CombinedRow[];
  salesTotal: number;
  salesCurrentPage: number;
  salesTotalPages: number;
}

const TAB_CONFIG = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "stock", label: "Stock Manager", icon: Package },
  { key: "sales", label: "Sales History", icon: History },
] as const;

export function ShareContent({
  token,
  sections,
  dashboardMetrics,
  chartData,
  inventoryProducts,
  inventoryCount,
  stockCurrentPage,
  stockTotalPages,
  salesMetrics,
  salesItems,
  salesTotal,
  salesCurrentPage,
  salesTotalPages,
}: ShareContentProps) {
  const tabs = TAB_CONFIG.filter((t) => sections.includes(t.key));
  const [activeTab, setActiveTab] = React.useState(tabs[0]?.key ?? "");
  const router = useRouter();

  const handleStockPageChange = (page: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("stockPage", String(page));
    router.push(`/share/${token}?${params.toString()}`);
  };

  const handleSalesPageChange = (page: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("salesPage", String(page));
    router.push(`/share/${token}?${params.toString()}`);
  };

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <ReadOnlyProvider>
      <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Tab bar — only shown when multiple sections */}
        {tabs.length > 1 && (
          <div className="flex gap-1 mb-8 border-b border-border">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-body-sm-strong border-b-2 transition-colors -mb-px",
                  activeTab === key
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-primary/40",
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Dashboard section */}
        {activeTab === "dashboard" && dashboardMetrics && chartData && (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                title="Total Lifetime Profit"
                value={formatter.format(dashboardMetrics.totalLifetimeProfit)}
                icon={Wallet}
              />
              <StatCard
                title="Current Inventory Value"
                value={formatter.format(dashboardMetrics.currentInventoryValue)}
                icon={Package}
              />
              <StatCard
                title="Current ROI (Sold Stock Only)"
                value={`${dashboardMetrics.currentROI.toFixed(1)}%`}
                icon={Percent}
              />
            </div>
            <ProfitChart
              weeklyData={chartData.weeklyData}
              monthlyData={chartData.monthlyData}
              allTimeData={chartData.allTimeData}
            />
          </div>
        )}

        {/* Stock Manager section */}
        {activeTab === "stock" && (
          <StockTable
            products={inventoryProducts}
            currentPage={stockCurrentPage}
            pageSize={10}
            totalCount={inventoryCount}
            totalPages={stockTotalPages}
            onPageChange={handleStockPageChange}
          />
        )}

        {/* Sales History section */}
        {activeTab === "sales" && salesMetrics && (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                title="Total Sales Today"
                value={formatter.format(salesMetrics.totalSalesToday)}
                icon={Wallet}
              />
              <StatCard
                title="Net Profit (Week)"
                value={formatter.format(salesMetrics.netProfitWeek)}
                icon={TrendingUp}
              />
              <StatCard
                title="Net Profit (Lifetime)"
                value={formatter.format(salesMetrics.netProfitLifetime)}
                icon={TrendingUp}
              />
            </div>
            <SalesTable
              items={salesItems}
              total={salesTotal}
              totalPages={salesTotalPages}
              currentPage={salesCurrentPage}
              pageSize={10}
              onPageChange={handleSalesPageChange}
            />
          </div>
        )}
      </div>
    </ReadOnlyProvider>
  );
}
