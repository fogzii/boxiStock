"use client";

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
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { TablePagination } from "@/components/ui/TablePagination";
import { CustomTooltip } from "@/components/ui/tooltip";
import { EditBundleModal } from "./editBundleModal";
import { EditSaleModal } from "./editSaleModal";
import { MergeSaleModal } from "./mergeSaleModal";

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

interface SalesTableProps {
  groups: ProductSaleGroup[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  bundles: BundleGroup[];
  bundlesTotalCount: number;
  bundlesTotalPages: number;
  bundlesCurrentPage: number;
  bundlesPageSize: number;
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
          className={`px-6 py-4 text-sm font-medium ${
            group.totalProfit >= 0 ? "text-emerald-400" : "text-destructive"
          }`}
        >
          {group.totalProfit >= 0 ? "+" : ""}
          {formatter.format(group.totalProfit)}
        </td>
        <td className="pl-4 pr-6 py-4 w-px">
          <div className="flex items-center gap-3">
            <CustomTooltip content="Merge this sale into another sale">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMergeOpen(true);
                }}
                className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
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
                className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer disabled:opacity-40"
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
                className={`px-6 py-3 text-sm font-medium ${
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
                      <CustomTooltip content="Edit sale">
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
                      </CustomTooltip>
                    )}
                  </EditSaleModal>
                  <CustomTooltip content="Delete sale">
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSale(e, sale.id)}
                      disabled={deletingId === sale.id}
                      className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40 cursor-pointer"
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

      <MergeSaleModal
        sourceGroup={group}
        isOpen={mergeOpen}
        onClose={() => setMergeOpen(false)}
      />
    </>
  );
}

function BundleGroupRow({
  bundle,
  formatter,
}: {
  bundle: BundleGroup;
  formatter: Intl.NumberFormat;
}) {
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
        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
          {formatDate(bundle.dateSold ?? bundle.createdAt)}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            <span className="font-semibold text-foreground text-sm">
              {bundle.bundleName}
            </span>
            <span className="text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded font-medium">
              Bundle
            </span>
          </div>
        </td>
        <td className="px-6 py-4 text-sm">
          {bundle.products.reduce((s, p) => s + p.totalQuantity, 0)}
        </td>
        <td className="px-6 py-4 text-sm text-muted-foreground">
          {formatter.format(bundle.totalBuyCost)}
        </td>
        <td className="px-6 py-4 text-sm font-medium text-primary">
          {formatter.format(bundle.totalSellPrice)}
        </td>
        <td
          className={`px-6 py-4 text-sm font-medium ${
            bundle.totalProfit >= 0 ? "text-emerald-400" : "text-destructive"
          }`}
        >
          {bundle.totalProfit >= 0 ? "+" : ""}
          {formatter.format(bundle.totalProfit)}
        </td>
        <td className="pl-4 pr-6 py-4 w-px">
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
                    className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
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
                className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer disabled:opacity-40"
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
        </td>
      </tr>

      {/* Product sub-rows */}
      {isOpen &&
        bundle.products.map((product) => (
          <tr
            key={product.productId ?? product.productName}
            className="bg-white/[0.06] hover:bg-white/[0.09] transition-colors animate-in fade-in slide-in-from-top-1 duration-150"
          >
            <td className="pl-14 pr-6 py-3 whitespace-nowrap text-sm text-muted-foreground border-l-2 border-primary/50">
              —
            </td>
            <td className="px-6 py-3 text-sm flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
              <span>{product.productName}</span>
              {!product.hasRestorable && (
                <span className="text-xs text-amber-500/70">(deleted)</span>
              )}
            </td>
            <td className="px-6 py-3 text-sm">{product.totalQuantity}</td>
            <td className="px-6 py-3 text-sm text-muted-foreground">
              {formatter.format(product.totalBuyCost)}
            </td>
            <td className="px-6 py-3 text-sm text-muted-foreground/50">—</td>
            <td
              className={`px-6 py-3 text-sm font-medium ${
                product.allocatedProfit >= 0
                  ? "text-emerald-400"
                  : "text-destructive"
              }`}
            >
              {product.allocatedProfit >= 0 ? "+" : ""}
              {formatter.format(product.allocatedProfit)}
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
          <div className="text-sm text-foreground/80 leading-relaxed bg-destructive/10 border border-destructive/20 rounded-lg p-3 space-y-2">
            <p>This will permanently delete this bundle sale record.</p>
            {unrestorableNames.length > 0 ? (
              <p className="text-amber-400/90">
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
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              disabled={isDeleting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold cursor-pointer"
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
        className={`flex items-center gap-1 cursor-pointer transition-colors select-none ${
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

export function SalesTable({
  groups,
  totalCount,
  totalPages,
  currentPage,
  pageSize,
  bundles,
  bundlesTotalCount,
  bundlesTotalPages,
  bundlesCurrentPage,
  bundlesPageSize,
}: SalesTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [isBundlesPending, startBundlesTransition] = React.useTransition();
  const [sortField, setSortField] = React.useState<SortField | null>("date");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [bundleSortField, setBundleSortField] =
    React.useState<SortField | null>("date");
  const [bundleSortDir, setBundleSortDir] = React.useState<SortDir>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortedGroups = React.useMemo(() => {
    if (!sortField) return groups;
    return [...groups].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;
      switch (sortField) {
        case "date":
          aVal = a.latestDate ?? "";
          bVal = b.latestDate ?? "";
          break;
        case "product":
          aVal = a.productName.toLowerCase();
          bVal = b.productName.toLowerCase();
          break;
        case "quantity":
          aVal = a.totalQuantity;
          bVal = b.totalQuantity;
          break;
        case "buy":
          aVal = a.totalSalePrice - a.totalProfit;
          bVal = b.totalSalePrice - b.totalProfit;
          break;
        case "sell":
          aVal = a.totalSalePrice;
          bVal = b.totalSalePrice;
          break;
        case "profit":
          aVal = a.totalProfit;
          bVal = b.totalProfit;
          break;
      }
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [groups, sortField, sortDir]);

  const handlePageChange = (page: number) => {
    startTransition(() => {
      router.push(`/sales?page=${page}`);
    });
  };

  const handleBundleSort = (field: SortField) => {
    if (bundleSortField === field) {
      setBundleSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setBundleSortField(field);
      setBundleSortDir("asc");
    }
  };

  const sortedBundles = React.useMemo(() => {
    if (!bundleSortField) return bundles;
    return [...bundles].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;
      switch (bundleSortField) {
        case "date":
          aVal = a.dateSold ?? a.createdAt ?? "";
          bVal = b.dateSold ?? b.createdAt ?? "";
          break;
        case "product":
          aVal = a.bundleName.toLowerCase();
          bVal = b.bundleName.toLowerCase();
          break;
        case "quantity":
          aVal = a.products.reduce((s, p) => s + p.totalQuantity, 0);
          bVal = b.products.reduce((s, p) => s + p.totalQuantity, 0);
          break;
        case "buy":
          aVal = a.totalBuyCost;
          bVal = b.totalBuyCost;
          break;
        case "sell":
          aVal = a.totalSellPrice;
          bVal = b.totalSellPrice;
          break;
        case "profit":
          aVal = a.totalProfit;
          bVal = b.totalProfit;
          break;
      }
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return bundleSortDir === "asc" ? cmp : -cmp;
    });
  }, [bundles, bundleSortField, bundleSortDir]);

  const handleBundlePageChange = (page: number) => {
    startBundlesTransition(() => {
      const params = new URLSearchParams(window.location.search);
      params.set("bpage", String(page));
      router.push(`/sales?${params.toString()}`);
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
                <SortHeader
                  label="Date"
                  field="date"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="px-6 py-4 font-medium"
                />
                <SortHeader
                  label="Product"
                  field="product"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="px-6 py-4 font-medium"
                />
                <SortHeader
                  label="Quantity"
                  field="quantity"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="px-6 py-4 font-medium"
                />
                <SortHeader
                  label="Buy"
                  field="buy"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="px-6 py-4 font-medium"
                />
                <SortHeader
                  label="Sell"
                  field="sell"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="px-6 py-4 font-medium"
                />
                <SortHeader
                  label="Net Profit"
                  field="profit"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="px-6 py-4 font-medium"
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
              ) : sortedGroups.length > 0 ? (
                sortedGroups.map((group) => (
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

      {/* ── Bundle Sales Section ── */}
      {(bundlesTotalCount > 0 || bundles.length > 0) && (
        <>
          <h2 className="mt-10 mb-3 text-xl font-bold tracking-tight text-foreground">
            Bundle Sales
          </h2>
          <div className="bg-card/50 backdrop-blur-md rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-border">
                  <tr>
                    <SortHeader
                      label="Date"
                      field="date"
                      sortField={bundleSortField}
                      sortDir={bundleSortDir}
                      onSort={handleBundleSort}
                      className="px-6 py-4 font-medium"
                    />
                    <SortHeader
                      label="Bundle"
                      field="product"
                      sortField={bundleSortField}
                      sortDir={bundleSortDir}
                      onSort={handleBundleSort}
                      className="px-6 py-4 font-medium"
                    />
                    <SortHeader
                      label="Quantity"
                      field="quantity"
                      sortField={bundleSortField}
                      sortDir={bundleSortDir}
                      onSort={handleBundleSort}
                      className="px-6 py-4 font-medium"
                    />
                    <SortHeader
                      label="Buy"
                      field="buy"
                      sortField={bundleSortField}
                      sortDir={bundleSortDir}
                      onSort={handleBundleSort}
                      className="px-6 py-4 font-medium"
                    />
                    <SortHeader
                      label="Sell"
                      field="sell"
                      sortField={bundleSortField}
                      sortDir={bundleSortDir}
                      onSort={handleBundleSort}
                      className="px-6 py-4 font-medium"
                    />
                    <SortHeader
                      label="Net Profit"
                      field="profit"
                      sortField={bundleSortField}
                      sortDir={bundleSortDir}
                      onSort={handleBundleSort}
                      className="px-6 py-4 font-medium"
                    />
                    <th className="pl-4 pr-6 py-4 w-[72px]" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {isBundlesPending ? (
                    SKELETON_ROW_KEYS.map((key) => (
                      <tr
                        key={key}
                        className="hover:bg-muted/10 transition-colors"
                      >
                        <td className="px-6 py-4">
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
                          <Skeleton className="h-5 w-20" />
                        </td>
                        <td className="pl-4 pr-6 py-4 w-px">
                          <Skeleton className="h-5 w-5" />
                        </td>
                      </tr>
                    ))
                  ) : sortedBundles.length > 0 ? (
                    sortedBundles.map((bundle) => (
                      <BundleGroupRow
                        key={bundle.bundleId}
                        bundle={bundle}
                        formatter={formatter}
                      />
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-8 text-center text-muted-foreground"
                      >
                        No bundle sales found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <TablePagination
            currentPage={bundlesCurrentPage}
            pageSize={bundlesPageSize}
            totalCount={bundlesTotalCount}
            totalPages={bundlesTotalPages}
            unitLabel="bundles"
            isPending={isBundlesPending}
            onPageChange={handleBundlePageChange}
            className="mt-6 px-1"
          />
        </>
      )}
    </>
  );
}
