"use client";

import { Button, CustomTooltip, Modal, Skeleton } from "@box-ds";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Edit2,
  Loader2,
  Merge,
  Package,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { deleteBundle, deleteProductSales, deleteSale } from "@/actions/stock";
import { EditBundleModal } from "@/components/modals/editBundleModal";
import { EditSaleModal } from "@/components/modals/editSaleModal";
import { MergeSaleModal } from "@/components/modals/mergeSaleModal";
import { TablePagination } from "@/components/ui/TablePagination";
import { useReadOnly } from "@/lib/context/readOnly";
import { formatCurrency } from "@/lib/formatting";

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

interface BundleProductDisplay {
  productId: string | null;
  productName: string;
  totalQuantity: number;
  totalBuyCost: number;
  weightedAvgBuyPrice: number;
  allocatedProfit: number;
  hasRestorable: boolean;
}

interface BundleGroup {
  bundleId: string;
  bundleName: string;
  dateSold: string | null;
  createdAt: string;
  totalSellPrice: number;
  totalBuyCost: number;
  totalProfit: number;
  products: BundleProductDisplay[];
}

export type CombinedRow =
  | { kind: "product"; data: ProductSaleGroup }
  | { kind: "bundle"; data: BundleGroup };

interface SalesTableProps {
  items: CombinedRow[];
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
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

function ProductGroupRow({ group }: { group: ProductSaleGroup }) {
  const isReadOnly = useReadOnly();
  const [isOpen, setIsOpen] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = React.useState(false);
  const [mergeOpen, setMergeOpen] = React.useState(false);

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
        <td className="px-6 py-4 whitespace-nowrap text-body-sm text-muted-foreground">
          {formatDate(group.latestDate)}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            <span className="text-body-sm-strong text-foreground">
              {group.productName}
            </span>
            <span className="text-caption text-muted-foreground/50">
              ({saleCount} {saleCount === 1 ? "sale" : "sales"})
            </span>
          </div>
        </td>
        <td className="px-6 py-4 text-body-sm">{group.totalQuantity}</td>
        <td className="px-6 py-4 text-body-sm text-muted-foreground">
          {formatCurrency(totalBuy)}
        </td>
        <td className="px-6 py-4 text-body-sm-strong text-primary">
          {formatCurrency(group.totalSalePrice)}
        </td>
        <td
          className={`px-6 py-4 text-body-sm-strong ${
            group.totalProfit >= 0 ? "text-positive" : "text-destructive"
          }`}
        >
          {group.totalProfit >= 0 ? "+" : ""}
          {formatCurrency(group.totalProfit)}
        </td>
        <td className="pl-4 pr-6 py-4 w-px">
          {!isReadOnly && (
            <div className="flex items-center gap-3">
              <CustomTooltip content="Merge this sale into another sale">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMergeOpen(true);
                  }}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label={`Merge sales for ${group.productName}`}
                >
                  <Merge className="w-4 h-4" />
                </button>
              </CustomTooltip>
              <CustomTooltip content="Delete all sales for this product">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmOpen(true);
                  }}
                  disabled={isDeletingGroup}
                  className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                  aria-label={`Delete all sales for ${group.productName}`}
                >
                  {isDeletingGroup ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </CustomTooltip>
            </div>
          )}
        </td>
      </tr>

      {/* Individual sale sub-rows */}
      {isOpen &&
        group.sales.map((sale) => {
          const saleBuy = sale.totalSalePrice - sale.totalProfit;
          return (
            <tr
              key={sale.id}
              className="bg-muted/30 hover:bg-muted/50 transition-colors animate-in fade-in slide-in-from-top-1 duration-150"
            >
              <td className="px-6 py-3 whitespace-nowrap text-body-sm text-muted-foreground border-l-2 border-primary/50">
                {formatDate(sale.dateSold ?? sale.createdAt)}
              </td>
              <td className="px-6 py-3">
                <div className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                  <span className="text-body-sm text-foreground">
                    {group.productName}
                  </span>
                </div>
                {sale.notes && (
                  <p className="text-caption text-muted-foreground/70 mt-0.5 truncate max-w-[200px] pl-[22px]">
                    {sale.notes}
                  </p>
                )}
              </td>
              <td className="px-6 py-3 text-body-sm">{sale.quantitySold}</td>
              <td className="px-6 py-3 text-body-sm text-muted-foreground">
                {formatCurrency(saleBuy)}
              </td>
              <td className="px-6 py-3 text-body-sm-strong text-primary">
                {formatCurrency(sale.totalSalePrice)}
              </td>
              <td
                className={`px-6 py-3 text-body-sm-strong ${
                  sale.totalProfit >= 0 ? "text-positive" : "text-destructive"
                }`}
              >
                {sale.totalProfit >= 0 ? "+" : ""}
                {formatCurrency(sale.totalProfit)}
              </td>
              <td className="pl-4 pr-6 py-3 w-px">
                {!isReadOnly && (
                  <div className="flex items-center gap-4">
                    <EditSaleModal sale={sale}>
                      {(open) => (
                        <CustomTooltip content="Edit sale">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              open();
                            }}
                            disabled={deletingId === sale.id}
                            className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-40"
                            aria-label="Edit sale"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </CustomTooltip>
                      )}
                    </EditSaleModal>
                    <CustomTooltip content="Delete sale">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSale(e, sale.id)}
                        disabled={deletingId === sale.id}
                        className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                        aria-label="Delete sale"
                      >
                        {deletingId === sale.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </CustomTooltip>
                  </div>
                )}
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
          <p className="text-body-sm text-foreground/80 bg-negative-bg border border-negative/20 rounded-lg p-3">
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
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isDeletingGroup}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteGroup}
              disabled={isDeletingGroup}
            >
              {isDeletingGroup
                ? "Deleting..."
                : `Delete ${saleCount === 1 ? "Sale" : "All Sales"}`}
            </Button>
          </div>
        </div>
      </Modal>

      <MergeSaleModal
        sourceGroup={group}
        isOpen={mergeOpen}
        onClose={() => setMergeOpen(false)}
      />
    </>
  );
}

function BundleGroupRow({ bundle }: { bundle: BundleGroup }) {
  const isReadOnly = useReadOnly();
  const [isOpen, setIsOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const router = useRouter();

  const unrestorableNames = bundle.products
    .filter((p) => !p.hasRestorable)
    .map((p) => p.productName);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteBundle(bundle.bundleId);
      toast.success(`Bundle "${bundle.bundleName}" deleted.`);
      setConfirmOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to delete bundle.");
      setIsDeleting(false);
    }
  }

  return (
    <>
      {/* Bundle header row */}
      <tr
        className="cursor-pointer hover:bg-primary/5 transition-colors"
        onClick={() => setIsOpen((o) => !o)}
      >
        <td className="px-6 py-4 whitespace-nowrap text-body-sm text-muted-foreground">
          {formatDate(bundle.dateSold ?? bundle.createdAt)}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            <span className="text-body-sm-strong text-foreground">
              {bundle.bundleName}
            </span>
            <span className="text-caption bg-primary/15 text-primary px-1.5 py-0.5 rounded">
              Bundle
            </span>
          </div>
        </td>
        <td className="px-6 py-4 text-body-sm">
          {bundle.products.reduce((s, p) => s + p.totalQuantity, 0)}
        </td>
        <td className="px-6 py-4 text-body-sm text-muted-foreground">
          {formatCurrency(bundle.totalBuyCost)}
        </td>
        <td className="px-6 py-4 text-body-sm-strong text-primary">
          {formatCurrency(bundle.totalSellPrice)}
        </td>
        <td
          className={`px-6 py-4 text-body-sm-strong ${
            bundle.totalProfit >= 0 ? "text-positive" : "text-destructive"
          }`}
        >
          {bundle.totalProfit >= 0 ? "+" : ""}
          {formatCurrency(bundle.totalProfit)}
        </td>
        <td className="pl-4 pr-6 py-4 w-px">
          {!isReadOnly && (
            <div className="flex items-center gap-3">
              <EditBundleModal bundle={bundle}>
                {(open) => (
                  <CustomTooltip content="Edit bundle">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        open();
                      }}
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label="Edit bundle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </CustomTooltip>
                )}
              </EditBundleModal>
              <CustomTooltip content="Delete bundle">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmOpen(true);
                  }}
                  disabled={isDeleting}
                  className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                  aria-label="Delete bundle"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </CustomTooltip>
            </div>
          )}
        </td>
      </tr>

      {/* Product sub-rows */}
      {isOpen &&
        bundle.products.map((product) => (
          <tr
            key={product.productId ?? product.productName}
            className="bg-muted/30 hover:bg-muted/50 transition-colors animate-in fade-in slide-in-from-top-1 duration-150"
          >
            <td className="pl-14 pr-6 py-3 whitespace-nowrap text-body-sm text-muted-foreground border-l-2 border-primary/50">
              —
            </td>
            <td className="px-6 py-3 text-body-sm flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
              <span>{product.productName}</span>
            </td>
            <td className="px-6 py-3 text-body-sm">{product.totalQuantity}</td>
            <td className="px-6 py-3 text-body-sm text-muted-foreground">
              {formatCurrency(product.totalBuyCost)}
            </td>
            <td className="px-6 py-3 text-body-sm text-muted-foreground/50">
              —
            </td>
            <td
              className={`px-6 py-3 text-body-sm-strong ${
                product.allocatedProfit >= 0
                  ? "text-positive"
                  : "text-destructive"
              }`}
            >
              {product.allocatedProfit >= 0 ? "+" : ""}
              {formatCurrency(product.allocatedProfit)}
            </td>
            <td className="pl-4 pr-6 py-3 w-px" />
          </tr>
        ))}

      {/* Delete confirmation modal */}
      <Modal
        isOpen={confirmOpen}
        onClose={() => !isDeleting && setConfirmOpen(false)}
        title={`Delete bundle "${bundle.bundleName}"?`}
      >
        <div className="flex flex-col gap-6">
          <div className="text-body-sm text-foreground/80 bg-negative-bg border border-negative/20 rounded-lg p-3 space-y-2">
            <p>This will permanently delete this bundle sale record.</p>
            {unrestorableNames.length > 0 ? (
              <p className="text-warning/90">
                <strong>⚠ Note:</strong> {unrestorableNames.join(", ")}{" "}
                {unrestorableNames.length === 1 ? "was" : "were"} fully depleted
                by this bundle and{" "}
                {unrestorableNames.length === 1 ? "has" : "have"} been deleted.
                {unrestorableNames.length === 1 ? " Its" : " Their"} stock
                cannot be restored.
              </p>
            ) : (
              <p>All stock quantities will be restored.</p>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Bundle"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

type SortField = "date" | "product" | "quantity" | "buy" | "sell" | "profit";
type SortDir = "asc" | "desc";

function SortHeader({
  label,
  field,
  sortField,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  field: SortField;
  sortField: SortField | null;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
  className?: string;
}) {
  const isActive = sortField === field;
  return (
    <th className={className}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`flex items-center gap-1 transition-colors select-none ${
          isActive ? "text-foreground" : "hover:text-foreground"
        }`}
      >
        {label}
        {isActive ? (
          sortDir === "asc" ? (
            <ArrowUp className="w-3 h-3 text-primary" />
          ) : (
            <ArrowDown className="w-3 h-3 text-primary" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-30" />
        )}
      </button>
    </th>
  );
}

function getEffectiveDate(item: CombinedRow): string {
  if (item.kind === "product") return item.data.latestDate ?? "";
  return item.data.dateSold ?? item.data.createdAt ?? "";
}

function getItemName(item: CombinedRow): string {
  return item.kind === "product"
    ? item.data.productName.toLowerCase()
    : item.data.bundleName.toLowerCase();
}

function getItemQty(item: CombinedRow): number {
  return item.kind === "product"
    ? item.data.totalQuantity
    : item.data.products.reduce((s, p) => s + p.totalQuantity, 0);
}

function getItemBuy(item: CombinedRow): number {
  return item.kind === "product"
    ? item.data.totalSalePrice - item.data.totalProfit
    : item.data.totalBuyCost;
}

function getItemSell(item: CombinedRow): number {
  return item.kind === "product"
    ? item.data.totalSalePrice
    : item.data.totalSellPrice;
}

function getItemProfit(item: CombinedRow): number {
  return item.data.totalProfit;
}

export function SalesTable({
  items,
  total,
  totalPages,
  currentPage,
  pageSize,
  onPageChange,
}: SalesTableProps) {
  const _isReadOnly = useReadOnly();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [sortField, setSortField] = React.useState<SortField | null>("date");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortedItems = React.useMemo(() => {
    if (!sortField) return items;
    return [...items].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;
      switch (sortField) {
        case "date":
          aVal = getEffectiveDate(a);
          bVal = getEffectiveDate(b);
          break;
        case "product":
          aVal = getItemName(a);
          bVal = getItemName(b);
          break;
        case "quantity":
          aVal = getItemQty(a);
          bVal = getItemQty(b);
          break;
        case "buy":
          aVal = getItemBuy(a);
          bVal = getItemBuy(b);
          break;
        case "sell":
          aVal = getItemSell(a);
          bVal = getItemSell(b);
          break;
        case "profit":
          aVal = getItemProfit(a);
          bVal = getItemProfit(b);
          break;
      }
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [items, sortField, sortDir]);

  const handlePageChange = (page: number) => {
    startTransition(() => {
      if (onPageChange) {
        onPageChange(page);
      } else {
        const params = new URLSearchParams(window.location.search);
        params.set("page", String(page));
        router.push(`/sales?${params.toString()}`);
      }
    });
  };

  return (
    <>
      <div className="bg-card/50 backdrop-blur-md rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-body-sm text-left">
            <thead className="text-caption text-muted-foreground uppercase bg-muted/20 border-b border-border">
              <tr>
                <SortHeader
                  label="Date"
                  field="date"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <SortHeader
                  label="Product"
                  field="product"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <SortHeader
                  label="Quantity"
                  field="quantity"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <SortHeader
                  label="Buy"
                  field="buy"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <SortHeader
                  label="Sell"
                  field="sell"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <SortHeader
                  label="Net Profit"
                  field="profit"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
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
              ) : sortedItems.length > 0 ? (
                sortedItems.map((item) =>
                  item.kind === "product" ? (
                    <ProductGroupRow
                      key={item.data.productId}
                      group={item.data}
                    />
                  ) : (
                    <BundleGroupRow
                      key={item.data.bundleId}
                      bundle={item.data}
                    />
                  ),
                )
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
        totalCount={total}
        totalPages={totalPages}
        unitLabel="entries"
        isPending={isPending}
        onPageChange={handlePageChange}
        className="mt-6 px-1"
      />
    </>
  );
}
