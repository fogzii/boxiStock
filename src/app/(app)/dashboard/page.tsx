import { Suspense } from "react";
import {
  getDashboardMetrics,
  getProfitChartData,
} from "@/actions/stock/metrics";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { surfaceOnHeader } from "@/components/layout/pageContainer";
import { ProfitChart } from "@/components/ui/ProfitChart";
import { formatCurrency } from "@/lib/formatting";

export default function DashboardPage() {
  return (
    <>
      {/* Stats and chart stream in behind separate boundaries so neither RPC
          holds up the other. */}
      <Suspense
        fallback={
          <PageHeader title="Dashboard Overview" statsLoading={4} overlap />
        }
      >
        <DashboardStats />
      </Suspense>

      <PageBody overlap>
        <Suspense fallback={<ChartSkeleton />}>
          <DashboardChart />
        </Suspense>
      </PageBody>
    </>
  );
}

async function DashboardStats() {
  const metrics = await getDashboardMetrics();

  return (
    <PageHeader
      title="Dashboard Overview"
      overlap
      stats={[
        {
          label: "Total Lifetime Profit",
          value: formatCurrency(metrics.totalLifetimeProfit),
        },
        {
          label: "Current Inventory Value",
          value: formatCurrency(metrics.currentInventoryValue),
        },
        {
          label: "Projected Profits",
          value: formatCurrency(metrics.projectedProfit),
        },
        {
          // The \n only takes effect in the tablet band - see PageHeader.
          label: "Current ROI\n(Sold Stock Only)",
          value: `${metrics.currentROI.toFixed(1)}%`,
        },
      ]}
    />
  );
}

async function DashboardChart() {
  const chartData = await getProfitChartData();

  return (
    <ProfitChart
      className={surfaceOnHeader}
      weeklyData={chartData.weeklyData}
      monthlyData={chartData.monthlyData}
      allTimeData={chartData.allTimeData}
    />
  );
}

function ChartSkeleton() {
  return (
    <div className={`rounded-2xl p-4 sm:p-8 ${surfaceOnHeader}`}>
      <div className="mb-6 h-5 w-40 animate-pulse rounded bg-primary/10 sm:mb-8" />
      <div className="h-[300px] w-full animate-pulse rounded-xl bg-primary/5 sm:h-[400px]" />
    </div>
  );
}
