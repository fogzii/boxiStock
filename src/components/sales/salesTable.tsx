"use client";

import { Edit2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { deleteSale } from "@/actions/stock";
import { Skeleton } from "@/components/ui/skeleton";
import { TablePagination } from "@/components/ui/TablePagination";
import { EditSaleModal } from "./editSaleModal";

interface SaleItem {
  id: string;
  dateSold: string;
  createdAt: string;
  quantitySold: number;
  totalSalePrice: number;
  totalProfit: number;
  notes?: string | null;
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
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteSale(id);
      toast.success("Sale deleted.");
    } catch {
      toast.error("Failed to delete sale.");
    } finally {
      setDeletingId(null);
    }
  };

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
                <th className="px-6 py-4 font-medium">Buy</th>
                <th className="px-6 py-4 font-medium">Sell</th>
                <th className="px-6 py-4 font-medium text-right">Net Profit</th>
                <th className="pl-4 pr-6 py-4 w-[72px]" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isPending ? (
                SKELETON_ROW_KEYS.map((key) => (
                  <tr key={key} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-24" />
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
                      <Skeleton className="h-5 w-20" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <Skeleton className="h-5 w-20" />
                      </div>
                    </td>
                    <td className="pl-4 pr-6 py-4 w-px">
                      <Skeleton className="h-5 w-5" />
                    </td>
                  </tr>
                ))
              ) : history.sales.length > 0 ? (
                history.sales.map((sale) => {
                  const totalBuy = sale.totalSalePrice - sale.totalProfit;
                  return (
                    <tr
                      key={sale.id}
                      className="hover:bg-muted/10 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {new Date(
                          sale.dateSold || sale.createdAt,
                        ).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-foreground">
                          {sale.Product?.name || "Unknown Product"}
                        </span>
                        {sale.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">
                            {sale.notes.slice(0, 50)}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">{sale.quantitySold}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatter.format(totalBuy)}
                      </td>
                      <td className="px-6 py-4 font-medium text-primary">
                        {formatter.format(sale.totalSalePrice)}
                      </td>
                      <td
                        className={`px-6 py-4 font-medium text-right ${sale.totalProfit >= 0 ? "text-emerald-400" : "text-destructive"}`}
                      >
                        {sale.totalProfit >= 0 ? "+" : ""}
                        {formatter.format(sale.totalProfit)}
                      </td>
                      <td className="pl-4 pr-6 py-4 w-px">
                        <div className="flex items-center gap-4">
                          <EditSaleModal sale={sale}>
                            {(open) => (
                              <button
                                type="button"
                                onClick={open}
                                disabled={deletingId === sale.id}
                                className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-40 cursor-pointer"
                                aria-label="Edit sale"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                          </EditSaleModal>
                          <button
                            type="button"
                            onClick={() => handleDelete(sale.id)}
                            disabled={deletingId === sale.id}
                            className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40 cursor-pointer"
                            aria-label="Delete sale"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
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
