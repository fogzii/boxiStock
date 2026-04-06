import { StatCard } from "@/components/ui/StatCard";
import { TrendingUp, Wallet, Package } from "lucide-react";
import { getSalesHistory, getSalesMetrics } from "@/actions/stock";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SalesTable } from "@/components/sales/salesTable";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const unresolvedParams = await searchParams;
  const currentPage = Number(unresolvedParams?.page) || 1;
  const pageSize = 10;

  const [metrics, history] = await Promise.all([
    getSalesMetrics(),
    getSalesHistory(currentPage, pageSize)
  ]);

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 sm:px-8 pt-6 sm:pt-8 w-full max-w-7xl mx-auto pb-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Sales History
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Sales Today"
          value={formatter.format(metrics.totalSalesToday)}
          icon={Wallet}
        />
        <StatCard
          title="Total Units Sold (Week)"
          value={`${metrics.totalUnitsSoldWeek} Units`}
          icon={Package}
        />
        <StatCard
          title="Net Profit (Week)"
          value={formatter.format(metrics.netProfitWeek)}
          icon={TrendingUp}
        />
      </div>

      {/* Sales Table and Pagination */}
      <SalesTable
        history={history}
        currentPage={currentPage}
        pageSize={pageSize}
      />
    </div>
  );
}
