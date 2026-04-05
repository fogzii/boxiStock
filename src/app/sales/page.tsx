import { StatCard } from "@/components/ui/StatCard";
import { TrendingUp, Wallet, Package } from "lucide-react";
import { getSalesHistory, getSalesMetrics } from "@/actions/stock";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

      {/* Sales Table */}
      <div className="bg-card/50 backdrop-blur-md rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Quantity</th>
                <th className="px-6 py-4 font-medium">Gross Sale</th>
                <th className="px-6 py-4 font-medium text-right">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {history.sales.length > 0 ? (
                history.sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {new Date(sale.createdAt).toLocaleDateString(undefined, { 
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {sale.Product?.name || "Unknown Product"}
                    </td>
                    <td className="px-6 py-4">
                      {sale.quantitySold}
                    </td>
                    <td className="px-6 py-4 font-medium text-emerald-400">
                      {formatter.format(sale.totalSalePrice)}
                    </td>
                    <td className="px-6 py-4 font-medium text-primary text-right">
                      +{formatter.format(sale.totalProfit)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No sales history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {history.totalPages > 1 && (
        <div className="flex flex-row items-center justify-between mt-6 px-1">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium text-foreground">{Math.min(currentPage * pageSize, history.totalCount)}</span> of <span className="font-medium text-foreground">{history.totalCount}</span> transactions
          </div>
          <div className="flex flex-row gap-2">
            {currentPage > 1 ? (
              <Link
                href={`/sales?page=${currentPage - 1}`}
                className="inline-flex items-center justify-center h-7 px-2.5 text-[0.8rem] font-medium rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Link>
            ) : (
              <span className="inline-flex items-center justify-center h-7 px-2.5 text-[0.8rem] font-medium rounded-lg border border-border bg-card opacity-50 pointer-events-none">
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </span>
            )}

            {currentPage < history.totalPages ? (
              <Link
                href={`/sales?page=${currentPage + 1}`}
                className="inline-flex items-center justify-center h-7 px-2.5 text-[0.8rem] font-medium rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            ) : (
              <span className="inline-flex items-center justify-center h-7 px-2.5 text-[0.8rem] font-medium rounded-lg border border-border bg-card opacity-50 pointer-events-none">
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
