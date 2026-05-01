"use client";

import { ChevronDown, ChevronRight, Edit2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { deleteProductSales, deleteSale } from "@/actions/stock";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { TablePagination } from "@/components/ui/TablePagination";
import { EditSaleModal } from "./editSaleModal";

interface SaleItem {
  id: string;
  dateSold: string | null;
  createdAt: string;
  quantitySold: number;
  totalSalePrice: number;
  totalProfit: number;
  notes?: string | null;
  Product?: { name: string } | null;
}

interface ProductSaleGroup {
  productId: string;
  productName: string;
  latestDate: string;
  totalQuantity: number;
  totalSalePrice: number;
  totalProfit: number;
  sales: SaleItem[];
}

interface SalesTableProps {
  groups: ProductSaleGroup[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

const SKELETON_ROW_KEYS = Array.from(
  { length: 8 },
  (_, i) => `sales-skeleton-${i}`,
);

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ProductGroupRow({
  group,
  formatter,
}: {
  group: ProductSaleGroup;
  formatter: Intl.NumberFormat;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = React.useState(false);

  const totalBuy = group.totalSalePrice - group.totalProfit;
  const saleCount = group.sales.length;

  const handleDeleteSale = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
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

  const handleDeleteGroup = async () => {
    setIsDeletingGroup(true);
    try {
      await deleteProductSales(group.productId);
      toast.success(`Deleted all sales for "${group.productName}".`);
      setConfirmOpen(false);
    } catch {
      toast.error("Failed to delete sales.");
      setIsDeletingGroup(false);
    }
  };

  return (
    <>
      {/* Product group header row — clickable */}
      <tr
        className="cursor-pointer hover:bg-primary/5 transition-colors"
        onClick={() => setIsOpen((o) => !o)}
      >
        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
          {formatDate(group.latestDate)}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            <span className="font-semibold text-foreground text-sm">
              {group.productName}
            </span>
            <span className="text-xs text-muted-foreground/50">
              ({saleCount} {saleCount === 1 ? "sale" : "sales"})
            </span>
          </div>
        </td>
        <td className="px-6 py-4 text-sm">{group.totalQuantity}</td>
        <td className="px-6 py-4 text-sm text-muted-foreground">
          {formatter.format(totalBuy)}
        </td>
        <td className="px-6 py-4 text-sm font-medium text-primary">
          {formatter.format(group.totalSalePrice)}
        </td>
        <td
          className={`px-6 py-4 text-sm font-medium text-right ${
            group.totalProfit >= 0 ? "text-emerald-400" : "text-destructive"
          }`}
        >
          {group.totalProfit >= 0 ? "+" : ""}
          {formatter.format(group.totalProfit)}
        </td>
        <td className="pl-4 pr-6 py-4 w-[72px]">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmOpen(true);
            }}
            className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
            aria-label={`Delete all sales for ${group.productName}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </td>
      </tr>

      {/* Individual sale sub-rows */}
      {isOpen &&
        group.sales.map((sale) => {
          const saleBuy = sale.totalSalePrice - sale.totalProfit;
          return (
            <tr
              key={sale.id}
              className="bg-white/[0.06] hover:bg-white/[0.09] transition-colors animate-in fade-in slide-in-from-top-1 duration-150"
            >
              <td className="pl-14 pr-6 py-3 whitespace-nowrap text-sm text-muted-foreground border-l-2 border-primary/50">
                {formatDate(sale.dateSold ?? sale.createdAt)}
              </td>
              <td className="px-6 py-3 text-xs text-muted-foreground/50 truncate max-w-[180px]">
                {sale.notes ?? ""}
              </td>
              <td className="px-6 py-3 text-sm">{sale.quantitySold}</td>
              <td className="px-6 py-3 text-sm text-muted-foreground">
                {formatter.format(saleBuy)}
              </td>
              <td className="px-6 py-3 text-sm font-medium text-primary">
                {formatter.format(sale.totalSalePrice)}
              </td>
              <td
                className={`px-6 py-3 text-sm font-medium text-right ${
                  sale.totalProfit >= 0
                    ? "text-emerald-400"
                    : "text-destructive"
                }`}
              >
                {sale.totalProfit >= 0 ? "+" : ""}
                {formatter.format(sale.totalProfit)}
              </td>
              <td className="pl-4 pr-6 py-3 w-px">
                <div className="flex items-center gap-4">
                  <EditSaleModal sale={sale}>
                    {(open) => (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          open();
                        }}
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
                    onClick={(e) => handleDeleteSale(e, sale.id)}
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
        })}

      {/* Group delete confirmation modal */}
      <Modal
        isOpen={confirmOpen}
        onClose={() => !isDeletingGroup && setConfirmOpen(false)}
        title={`Delete all sales for "${group.productName}"?`}
      >
        <div className="flex flex-col gap-6">
          <p className="text-sm text-foreground/80 leading-relaxed bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            This will permanently delete{" "}
            <strong className="text-foreground">
              {saleCount} {saleCount === 1 ? "sale" : "sales"}
            </strong>{" "}
            for <strong className="text-foreground">{group.productName}</strong>
            . This cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              disabled={isDeletingGroup}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDeleteGroup}
              disabled={isDeletingGroup}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold cursor-pointer"
            >
              {isDeletingGroup
                ? "Deleting..."
                : `Delete ${saleCount === 1 ? "Sale" : "All Sales"}`}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function SalesTable({
  groups,
  totalCount,
  totalPages,
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
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-24" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-5 w-40" />
                      </div>
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
              ) : groups.length > 0 ? (
                groups.map((group) => (
                  <ProductGroupRow
                    key={group.productId}
                    group={group}
                    formatter={formatter}
                  />
                ))
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
        totalCount={totalCount}
        totalPages={totalPages}
        unitLabel="products"
        isPending={isPending}
        onPageChange={handlePageChange}
        className="mt-6 px-1"
      />
    </>
  );
}
