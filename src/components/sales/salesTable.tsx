"use client";

import {
  ActionMenu,
  Button,
  Modal,
  Pagination,
  Skeleton,
  SortableTableHead,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@box-ds";
import { Edit2, Loader2, Merge, Package, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { deleteBundle } from "@/actions/stock/bundles";
import { deleteProductSales, deleteSale } from "@/actions/stock/sales";
import { EditBundleModal } from "@/components/modals/editBundleModal";
import { EditSaleModal } from "@/components/modals/editSaleModal";
import { MergeSaleModal } from "@/components/modals/mergeSaleModal";
import { ExpandRowButton } from "@/components/ui/ExpandRowButton";
import { TruncatedName } from "@/components/ui/TruncatedName";
import { useReadOnly } from "@/lib/context/readOnly";
import { formatCurrency } from "@/lib/formatting";
import type {
  BundleGroup,
  CombinedSalesRow,
  ProductSaleGroup,
  SaleWithProductName,
} from "@/lib/stock/types";
import { cn } from "@/lib/utils";

type SaleItem = SaleWithProductName;

export type CombinedRow = CombinedSalesRow;

interface SalesTableProps {
  items: CombinedRow[];
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
  sort?: string;
  onSortChange?: (sort: string) => void;
  isExternalPending?: boolean;
  /** Overrides the table's surface — e.g. an opaque card when it overlaps the header. */
  className?: string;
}

const SKELETON_ROW_KEYS = Array.from(
  { length: 8 },
  (_, i) => `sales-skeleton-${i}`,
);

/** Visible cap for product and bundle names in the sales table. Raise this until a horizontal scrollbar appears. */
const SALES_NAME_MAX_WIDTH_PX = 320;

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function SaleSubRow({
  sale,
  groupProductName,
  id,
}: {
  sale: SaleItem;
  groupProductName: string;
  id?: string;
}) {
  const isReadOnly = useReadOnly();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const editOpenRef = React.useRef<() => void>(() => {});
  const saleBuy = sale.totalSalePrice - sale.totalProfit;

  const handleDelete = async () => {
    setDeletingId(sale.id);
    try {
      await deleteSale(sale.id);
      toast.success("Sale deleted.");
    } catch {
      toast.error("Failed to delete sale.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <TableRow
      id={id}
      className="bg-muted/30 hover:bg-muted/50 transition-colors animate-in fade-in slide-in-from-top-1 duration-150"
    >
      <TableCell className="px-6 py-2 border-l-2 border-primary/50">
        <div className="flex items-center gap-2">
          <Package className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
          <TruncatedName
            className="text-body-sm text-foreground"
            maxWidth={SALES_NAME_MAX_WIDTH_PX}
          >
            {groupProductName}
          </TruncatedName>
        </div>
        {sale.notes && (
          <p className="text-caption text-muted-foreground/70 mt-0.5 truncate max-w-[200px] pl-[22px]">
            {sale.notes}
          </p>
        )}
      </TableCell>
      <TableCell className="px-6 py-2 text-right text-body-sm">
        {sale.quantitySold}
      </TableCell>
      <TableCell className="px-6 py-2 text-right text-body-sm text-muted-foreground">
        {formatCurrency(saleBuy)}
      </TableCell>
      <TableCell className="px-6 py-2 text-right text-body-sm-strong text-primary">
        {formatCurrency(sale.totalSalePrice)}
      </TableCell>
      <TableCell
        className={`px-6 py-2 text-right text-body-sm-strong ${
          sale.totalProfit >= 0 ? "text-positive" : "text-destructive"
        }`}
      >
        {sale.totalProfit >= 0 ? "+" : ""}
        {formatCurrency(sale.totalProfit)}
      </TableCell>
      <TableCell className="whitespace-nowrap px-6 py-2 text-right text-body-sm text-muted-foreground">
        {formatDate(sale.dateSold ?? sale.createdAt)}
      </TableCell>
      <TableCell className="w-px py-2 pr-6 pl-2">
        {!isReadOnly && (
          <>
            <EditSaleModal sale={sale}>
              {(open) => {
                editOpenRef.current = open;
                return null;
              }}
            </EditSaleModal>
            <ActionMenu
              items={[
                {
                  label: "Edit sale",
                  icon: <Edit2 />,
                  onClick: () => editOpenRef.current(),
                  disabled: deletingId === sale.id,
                },
                {
                  label: "Delete sale",
                  icon:
                    deletingId === sale.id ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Trash2 />
                    ),
                  variant: "destructive",
                  onClick: handleDelete,
                  disabled: deletingId === sale.id,
                },
              ]}
            />
          </>
        )}
      </TableCell>
    </TableRow>
  );
}

function ProductGroupRow({ group }: { group: ProductSaleGroup }) {
  const isReadOnly = useReadOnly();
  const [isOpen, setIsOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = React.useState(false);
  const [mergeOpen, setMergeOpen] = React.useState(false);

  const totalBuy = group.totalSalePrice - group.totalProfit;
  const saleCount = group.sales.length;

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

  const salesPanelId = `sales-product-${group.productId}-sales`;

  return (
    <>
      <TableRow className="hover:bg-primary/5 transition-colors">
        <TableCell className="px-6 py-2.5">
          <ExpandRowButton
            expanded={isOpen}
            controlsId={salesPanelId}
            label={`${isOpen ? "Collapse" : "Expand"} ${group.productName}`}
            onToggle={() => setIsOpen((open) => !open)}
          >
            <TruncatedName
              className="text-body-sm-strong text-foreground"
              maxWidth={SALES_NAME_MAX_WIDTH_PX}
            >
              {group.productName}
            </TruncatedName>
            <span className="shrink-0 text-caption text-muted-foreground/50">
              ({saleCount} {saleCount === 1 ? "sale" : "sales"})
            </span>
          </ExpandRowButton>
        </TableCell>
        <TableCell className="px-6 py-2.5 text-right text-body-sm">
          {group.totalQuantity}
        </TableCell>
        <TableCell className="px-6 py-2.5 text-right text-body-sm text-muted-foreground">
          {formatCurrency(totalBuy)}
        </TableCell>
        <TableCell className="px-6 py-2.5 text-right text-body-sm-strong text-primary">
          {formatCurrency(group.totalSalePrice)}
        </TableCell>
        <TableCell
          className={`px-6 py-2.5 text-right text-body-sm-strong ${
            group.totalProfit >= 0 ? "text-positive" : "text-destructive"
          }`}
        >
          {group.totalProfit >= 0 ? "+" : ""}
          {formatCurrency(group.totalProfit)}
        </TableCell>
        <TableCell className="whitespace-nowrap px-6 py-2.5 text-right text-body-sm text-muted-foreground">
          {formatDate(group.latestDate)}
        </TableCell>
        <TableCell className="w-px py-2.5 pr-6 pl-2">
          {!isReadOnly && (
            <ActionMenu
              items={[
                {
                  label: "Merge sales",
                  icon: <Merge />,
                  onClick: () => setMergeOpen(true),
                },
                {
                  label: "Delete all sales",
                  icon: isDeletingGroup ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Trash2 />
                  ),
                  variant: "destructive",
                  onClick: () => setConfirmOpen(true),
                  disabled: isDeletingGroup,
                },
              ]}
            />
          )}
        </TableCell>
      </TableRow>

      {isOpen &&
        group.sales.map((sale, index) => (
          <SaleSubRow
            key={sale.id}
            id={index === 0 ? salesPanelId : undefined}
            sale={sale}
            groupProductName={group.productName}
          />
        ))}

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
  const editOpenRef = React.useRef<() => void>(() => {});

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

  const productsPanelId = `sales-bundle-${bundle.bundleId}-products`;

  return (
    <>
      <TableRow className="hover:bg-primary/5 transition-colors">
        <TableCell className="px-6 py-2.5">
          <ExpandRowButton
            expanded={isOpen}
            controlsId={productsPanelId}
            label={`${isOpen ? "Collapse" : "Expand"} ${bundle.bundleName}`}
            onToggle={() => setIsOpen((open) => !open)}
          >
            <TruncatedName
              className="text-body-sm-strong text-foreground"
              maxWidth={SALES_NAME_MAX_WIDTH_PX}
            >
              {bundle.bundleName}
            </TruncatedName>
            <span className="shrink-0 rounded bg-primary/15 px-1.5 py-0.5 text-caption text-primary">
              Bundle
            </span>
          </ExpandRowButton>
        </TableCell>
        <TableCell className="px-6 py-2.5 text-right text-body-sm">
          {bundle.products.reduce((s, p) => s + p.totalQuantity, 0)}
        </TableCell>
        <TableCell className="px-6 py-2.5 text-right text-body-sm text-muted-foreground">
          {formatCurrency(bundle.totalBuyCost)}
        </TableCell>
        <TableCell className="px-6 py-2.5 text-right text-body-sm-strong text-primary">
          {formatCurrency(bundle.totalSellPrice)}
        </TableCell>
        <TableCell
          className={`px-6 py-2.5 text-right text-body-sm-strong ${
            bundle.totalProfit >= 0 ? "text-positive" : "text-destructive"
          }`}
        >
          {bundle.totalProfit >= 0 ? "+" : ""}
          {formatCurrency(bundle.totalProfit)}
        </TableCell>
        <TableCell className="whitespace-nowrap px-6 py-2.5 text-right text-body-sm text-muted-foreground">
          {formatDate(bundle.dateSold ?? bundle.createdAt)}
        </TableCell>
        <TableCell className="w-px py-2.5 pr-6 pl-2">
          {!isReadOnly && (
            <>
              <EditBundleModal bundle={bundle}>
                {(open) => {
                  editOpenRef.current = open;
                  return null;
                }}
              </EditBundleModal>
              <ActionMenu
                items={[
                  {
                    label: "Edit bundle",
                    icon: <Edit2 />,
                    onClick: () => editOpenRef.current(),
                  },
                  {
                    label: "Delete bundle",
                    icon: isDeleting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Trash2 />
                    ),
                    variant: "destructive",
                    onClick: () => setConfirmOpen(true),
                    disabled: isDeleting,
                  },
                ]}
              />
            </>
          )}
        </TableCell>
      </TableRow>

      {isOpen &&
        bundle.products.map((product, index) => (
          <TableRow
            key={product.productId ?? product.productName}
            id={index === 0 ? productsPanelId : undefined}
            className="bg-muted/30 hover:bg-muted/50 transition-colors animate-in fade-in slide-in-from-top-1 duration-150"
          >
            <TableCell className="border-l-2 border-primary/50 py-2 pr-6 pl-14 text-body-sm">
              <div className="flex items-center gap-2">
                <Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                <TruncatedName maxWidth={SALES_NAME_MAX_WIDTH_PX}>{product.productName}</TruncatedName>
              </div>
            </TableCell>
            <TableCell className="px-6 py-2 text-right text-body-sm">
              {product.totalQuantity}
            </TableCell>
            <TableCell className="px-6 py-2 text-right text-body-sm text-muted-foreground">
              {formatCurrency(product.totalBuyCost)}
            </TableCell>
            <TableCell className="px-6 py-2 text-right text-body-sm text-muted-foreground/50">
              -
            </TableCell>
            <TableCell
              className={`px-6 py-2 text-right text-body-sm-strong ${
                product.allocatedProfit >= 0
                  ? "text-positive"
                  : "text-destructive"
              }`}
            >
              {product.allocatedProfit >= 0 ? "+" : ""}
              {formatCurrency(product.allocatedProfit)}
            </TableCell>
            <TableCell className="whitespace-nowrap px-6 py-2 text-right text-body-sm text-muted-foreground">
              -
            </TableCell>
            <TableCell className="w-px py-2 pr-6 pl-2" />
          </TableRow>
        ))}

      {/* Delete confirmation modal */}
      <Modal
        isOpen={confirmOpen}
        onClose={() => !isDeleting && setConfirmOpen(false)}
        title={`Delete bundle "${bundle.bundleName}"?`}
      >
        <div className="flex flex-col gap-6">
          <div className="text-body-sm text-foreground/80 bg-negative-bg border border-negative/20 rounded-lg p-3">
            <p>This will permanently delete this bundle sale record.</p>
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

const VALID_SORT_FIELDS: ReadonlySet<SortField> = new Set([
  "date",
  "product",
  "quantity",
  "buy",
  "sell",
  "profit",
]);

function parseSortParam(raw: string | undefined): {
  field: SortField;
  dir: SortDir;
} {
  if (typeof raw === "string") {
    const idx = raw.lastIndexOf("_");
    if (idx > 0) {
      const field = raw.slice(0, idx);
      const dir = raw.slice(idx + 1);
      if (
        VALID_SORT_FIELDS.has(field as SortField) &&
        (dir === "asc" || dir === "desc")
      ) {
        return { field: field as SortField, dir };
      }
    }
  }
  return { field: "date", dir: "desc" };
}

function SalesSortHeader({
  label,
  field,
  sortField,
  sortDir,
  onSort,
  className,
  alignRight,
}: {
  label: string;
  field: SortField;
  sortField: SortField | null;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
  className?: string;
  alignRight?: boolean;
}) {
  return (
    <SortableTableHead
      className={className}
      active={sortField === field}
      direction={sortDir}
      align={alignRight ? "right" : "left"}
      onToggle={() => onSort(field)}
    >
      {label}
    </SortableTableHead>
  );
}

export function SalesTable({
  items,
  total,
  totalPages,
  currentPage,
  pageSize,
  onPageChange,
  sort: sortProp,
  onSortChange,
  isExternalPending = false,
  className,
}: SalesTableProps) {
  const router = useRouter();
  const [internalPending, startTransition] = React.useTransition();
  const isPending = internalPending || isExternalPending;
  const { field: sortField, dir: sortDir } = parseSortParam(sortProp);

  const handleSort = (field: SortField) => {
    const nextDir: SortDir =
      sortField === field ? (sortDir === "asc" ? "desc" : "asc") : "asc";
    const nextSort = `${field}_${nextDir}`;
    if (onSortChange) {
      startTransition(() => {
        onSortChange(nextSort);
      });
    } else {
      startTransition(() => {
        const params = new URLSearchParams(window.location.search);
        params.set("sort", nextSort);
        params.delete("page");
        router.push(`/sales?${params.toString()}`, { scroll: false });
      });
    }
  };

  const handlePageChange = (page: number) => {
    if (onPageChange) {
      startTransition(() => {
        onPageChange(page);
      });
      return;
    }
    startTransition(() => {
      const params = new URLSearchParams(window.location.search);
      params.set("page", String(page));
      router.push(`/sales?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <>
      <div
        className={cn(
          "min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-card/50 backdrop-blur-md",
          className,
        )}
      >
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-canvas-soft text-caption text-muted-foreground uppercase hover:bg-canvas-soft">
              <SalesSortHeader
                label="Product"
                field="product"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                className="px-6 py-4"
              />
              <SalesSortHeader
                alignRight
                label="Quantity"
                field="quantity"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                className="px-6 py-4"
              />
              <SalesSortHeader
                alignRight
                label="Buy"
                field="buy"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                className="px-6 py-4"
              />
              <SalesSortHeader
                alignRight
                label="Sell"
                field="sell"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                className="px-6 py-4"
              />
              <SalesSortHeader
                alignRight
                label="Net Profit"
                field="profit"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                className="px-6 py-4"
              />
              <SalesSortHeader
                alignRight
                label="Date"
                field="date"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                className="px-6 py-4"
              />
              <TableHead className="w-[56px] py-4 pr-6 pl-2" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              SKELETON_ROW_KEYS.map((key) => (
                <TableRow
                  key={key}
                  className="hover:bg-muted/10 transition-colors"
                >
                  <TableCell className="px-6 py-2.5">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded" />
                      <Skeleton className="h-5 w-40" />
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-2.5">
                    <div className="flex justify-end">
                      <Skeleton className="h-5 w-12" />
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-2.5">
                    <div className="flex justify-end">
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-2.5">
                    <div className="flex justify-end">
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-2.5">
                    <div className="flex justify-end">
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-2.5">
                    <div className="flex justify-end">
                      <Skeleton className="h-5 w-24" />
                    </div>
                  </TableCell>
                  <TableCell className="w-px py-2.5 pr-6 pl-2">
                    <Skeleton className="h-5 w-5" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length > 0 ? (
              items.map((item) =>
                item.kind === "product" ? (
                  <ProductGroupRow
                    key={item.data.productId}
                    group={item.data}
                  />
                ) : (
                  <BundleGroupRow key={item.data.bundleId} bundle={item.data} />
                ),
              )
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="px-6 py-8 text-center text-muted-foreground"
                >
                  No sales history found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
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
