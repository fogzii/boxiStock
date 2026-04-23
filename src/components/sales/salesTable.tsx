"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TablePagination } from "@/components/ui/TablePagination";

interface SaleItem {
  id: string;
  createdAt: string;
  quantitySold: number;
  totalSalePrice: number;
  totalProfit: number;
  Product?: {
    name: string;
  } | null;
}

interface SalesTableProps {
  history: {
    sales: SaleItem[];
    totalCount: number;
    totalPages: number;
  };
  currentPage: number;
  pageSize: number;
}

const SKELETON_ROW_KEYS = Array.from(
  { length: 10 },
  (_, i) => `sales-skeleton-${i}`,
);

export function SalesTable({
  history,
  currentPage,
  pageSize,
}: SalesTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const handlePageChange = (page: number) => {
    startTransition(() => {
      router.push(`/sales?page=${page}`);
    });
  };

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <>
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
              {isPending ? (
                SKELETON_ROW_KEYS.map((key) => (
                  <tr key={key} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-32" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-40" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-12" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-20" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <Skeleton className="h-5 w-20" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : history.sales.length > 0 ? (
                history.sales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="hover:bg-muted/10 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {new Date(sale.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {sale.Product?.name || "Unknown Product"}
                    </td>
                    <td className="px-6 py-4">{sale.quantitySold}</td>
                    <td className="px-6 py-4 font-medium text-primary">
                      {formatter.format(sale.totalSalePrice)}
                    </td>
                    <td className="px-6 py-4 font-medium text-emerald-400 text-right">
                      +{formatter.format(sale.totalProfit)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No sales history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TablePagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalCount={history.totalCount}
        totalPages={history.totalPages}
        unitLabel="transactions"
        isPending={isPending}
        onPageChange={handlePageChange}
        className="mt-6 px-1"
      />
    </>
  );
}
