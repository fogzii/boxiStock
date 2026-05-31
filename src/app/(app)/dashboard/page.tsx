import { Package, Percent, Wallet } from "lucide-react";
import { Suspense } from "react";
import {
  getDashboardMetrics,
  getProfitChartData,
} from "@/actions/stock/metrics";
import { ProfitChart } from "@/components/ui/ProfitChart";
import { StatCard } from "@/components/ui/StatCard";

export default function DashboardPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6 sm:pt-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-display-md text-foreground">
          Dashboard Overview
        </h1>
      </div>

      {/* Data-dependent content streams in behind a Suspense boundary so the
          page chrome (heading) paints immediately — improving FCP — instead of
          blocking the whole route on the dashboard RPC queries. */}
      <Suspense fallback={<DashboardContentSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  const [metrics, chartData] = await Promise.all([
    getDashboardMetrics(),
    getProfitChartData(),
  ]);

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <>
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
          title="Current ROI (Sold Stock Only)"
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
    </>
  );
}

function DashboardContentSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-primary/5 border border-primary/10 p-6 rounded-2xl"
          >
            <div className="mb-4 h-10 w-10 animate-pulse rounded-lg bg-primary/10" />
            <div className="mb-2 h-3 w-32 animate-pulse rounded bg-primary/10" />
            <div className="h-8 w-24 animate-pulse rounded bg-primary/10" />
          </div>
        ))}
      </div>
      <div className="mb-8 rounded-2xl border border-primary/10 bg-primary/5 p-6">
        <div className="mb-6 h-5 w-40 animate-pulse rounded bg-primary/10" />
        <div className="h-[300px] w-full animate-pulse rounded-xl bg-primary/5 sm:h-[400px]" />
      </div>
    </>
  );
}
