import { TrendingUp, Wallet } from "lucide-react";
import { getSalesMetrics } from "@/actions/stock/metrics";
import { getCombinedSalesGrouped } from "@/actions/stock/sales";
import { SalesTable } from "@/components/sales/salesTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatCard } from "@/components/ui/StatCard";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; sort?: string }>;
}) {
  const unresolvedParams = await searchParams;
  const currentPage = Number(unresolvedParams?.page) || 1;
  const searchParamStr = unresolvedParams?.search;
  const sortParam = unresolvedParams?.sort ?? "date_desc";
  const pageSize = 10;

  const [metrics, combined] = await Promise.all([
    getSalesMetrics(),
    getCombinedSalesGrouped(currentPage, pageSize, searchParamStr, sortParam),
  ]);

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6 sm:pt-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="font-display text-display-md text-foreground">
          Sales History
        </h1>
        <SearchInput placeholder="Search product or bundle names..." />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Sales Today"
          value={formatter.format(metrics.totalSalesToday)}
          icon={Wallet}
        />
        <StatCard
          title="Net Profit (Week)"
          value={formatter.format(metrics.netProfitWeek)}
          icon={TrendingUp}
        />
        <StatCard
          title="Net Profit (Lifetime)"
          value={formatter.format(metrics.netProfitLifetime)}
          icon={TrendingUp}
        />
      </div>

      {/* Sales Table and Pagination */}
      <SalesTable
        items={combined.items}
        total={combined.total}
        totalPages={combined.totalPages}
        currentPage={currentPage}
        pageSize={pageSize}
        sort={sortParam}
      />
    </div>
  );
}
