import { StatCard } from "@/components/ui/StatCard";
import { ProfitChart } from "@/components/ui/ProfitChart";
import { Wallet, Package, Percent } from "lucide-react";
import { getDashboardMetrics, getProfitChartData } from "@/actions/stock";

export default async function DashboardPage() {
  const [metrics, chartData] = await Promise.all([
    getDashboardMetrics(),
    getProfitChartData(),
  ]);

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 sm:px-8 pt-6 sm:pt-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard Overview
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Lifetime Profit"
          value={formatter.format(metrics.totalLifetimeProfit)}
          icon={Wallet}
        />
        <StatCard
          title="Current Inventory Value"
          value={formatter.format(metrics.currentInventoryValue)}
          icon={Package}
        />
        <StatCard
          title="Current ROI"
          value={`${metrics.currentROI.toFixed(1)}%`}
          icon={Percent}
        />
      </div>

      {/* Main Chart Card */}
      <div className="mb-8">
        <ProfitChart
          weeklyData={chartData.weeklyData}
          monthlyData={chartData.monthlyData}
          allTimeData={chartData.allTimeData}
        />
      </div>

    </div>
  );
}
