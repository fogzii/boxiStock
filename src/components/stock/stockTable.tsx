"use client";

import {
  Button,
  CustomTooltip,
  Pagination,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@box-ds";
import {
  ArrowLeftRight,
  DollarSign,
  Package,
  Plus,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import {
  deleteLot,
  markAsStocked,
  updateLotNotes,
} from "@/actions/stock/inventory";
import { AddLotModal } from "@/components/modals/addLotModal";
import { EditProductModal } from "@/components/modals/editProductModal";
import { SellAllModal } from "@/components/modals/sellAllModal";
import { LotCard } from "@/components/stock/lotCard";
import { ExpandRowButton } from "@/components/ui/ExpandRowButton";
import { TruncatedName } from "@/components/ui/TruncatedName";
import {
  useHideProjectedProfit,
  useHideSellPrice,
  useHideStockAmounts,
  useReadOnly,
} from "@/lib/context/readOnly";
import { formatSignedAmount } from "@/lib/formatting";
import { projectedProfitTotal, toSellPrice } from "@/lib/stock/projections";
import type { ProductWithLots } from "@/lib/stock/types";
import { cn } from "@/lib/utils";

export type { ProductWithLots } from "@/lib/stock/types";

/**
 * One column, two views. Which of them a viewer may see is a per-share-link
 * permission, so the swap control only appears when both are allowed — a link
 * that shares the sell price must not become a way to read the margin.
 */
type ProjectionView = "profit" | "sell";

const PROJECTION_VIEW_KEY = "boxistock:stock-projection-view";

const PROJECTION_LABEL: Record<ProjectionView, string> = {
  profit: "Projected Profit",
  sell: "Sell Price Per Unit",
};

/** Visible cap for product names in the inventory table. Raise this until a horizontal scrollbar appears. */
const STOCK_NAME_MAX_WIDTH_PX = 400;

/**
 * The active view, plus whether swapping is offered at all. When only one view
 * is permitted the stored preference is ignored rather than obeyed, so a
 * previously-saved "profit" can never surface on a sell-price-only link.
 */
function useProjectionView(allowed: ProjectionView[]) {
  // Always start on the first allowed view so server and first client render
  // agree; the stored preference is applied in an effect to avoid a hydration
  // mismatch.
  const [stored, setStored] = React.useState<ProjectionView | null>(null);

  React.useEffect(() => {
    const raw = window.localStorage.getItem(PROJECTION_VIEW_KEY);
    if (raw === "profit" || raw === "sell") setStored(raw);
  }, []);

  const view =
    stored && allowed.includes(stored) ? stored : (allowed[0] ?? "profit");

  const toggle = React.useCallback(() => {
    const next: ProjectionView = view === "profit" ? "sell" : "profit";
    if (!allowed.includes(next)) return;
    window.localStorage.setItem(PROJECTION_VIEW_KEY, next);
    setStored(next);
  }, [view, allowed]);

  return { view, toggle, canSwap: allowed.length > 1 };
}

interface StockTableProps {
  products: ProductWithLots[];
  currentPage?: number;
  totalCount?: number;
  totalPages?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  isExternalPending?: boolean;
  /** Overrides the table's surface — e.g. an opaque card when it overlaps the header. */
  className?: string;
}

const SKELETON_ROW_KEYS = Array.from(
  { length: 10 },
  (_, i) => `stock-skeleton-${i}`,
);

function ProductRow({
  product,
  projectionView,
  showProjectionColumn,
}: {
  product: ProductWithLots;
  projectionView: ProjectionView;
  showProjectionColumn: boolean;
}) {
  const isReadOnly = useReadOnly();
  const hideAmounts = useHideStockAmounts();
  const [isOpen, setIsOpen] = React.useState(false);
  const [lots, setLots] = React.useState(product.lots);
  const [isUpdating, setIsUpdating] = React.useState<string | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    setLots(product.lots);
  }, [product.lots]);

  // Totals cover every lot still holding units — received and on order alike.
  // The status filter already narrows which lots reach this component, so
  // "In Stock" totals received units, "Pending" totals ordered units, and "All"
  // totals both. This also matches the page's own "Total Stock Value" header
  // and the dashboard's "Current Inventory Value", which never split the two.
  const totalStock = lots.reduce((acc, lot) => acc + lot.remainingQuantity, 0);

  const totalValue = lots.reduce(
    (acc, lot) => acc + lot.remainingQuantity * lot.buyPrice,
    0,
  );

  // "Sell all" stays gated on received stock only — you can't sell units that
  // haven't arrived, so this deliberately does not follow the totals above.
  const sellableStock = lots.reduce(
    (acc, lot) => (lot.isStocked ? acc + lot.remainingQuantity : acc),
    0,
  );

  const handleMarkStocked = async (lotId: string) => {
    try {
      setIsUpdating(lotId);
      await markAsStocked(lotId);
      setLots(
        lots.map((lot) =>
          lot.id === lotId ? { ...lot, isStocked: true } : lot,
        ),
      );
    } catch (error) {
      console.error("Failed to mark as stocked:", error);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDelete = async (lotId: string) => {
    try {
      setIsUpdating(lotId);
      await deleteLot(lotId);
      const updated = lots.filter((lot) => lot.id !== lotId);
      setLots(updated);
      if (updated.length === 0) router.refresh();
    } catch (error) {
      console.error("Failed to delete lot:", error);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleNotesUpdate = async (
    lotId: string,
    notes: string | null,
  ): Promise<void> => {
    await updateLotNotes(lotId, notes);
    setLots(lots.map((lot) => (lot.id === lotId ? { ...lot, notes } : lot)));
  };

  // Profit is a total across the remaining units; sell price is per unit, as
  // its column name says. They answer different questions, so they are
  // deliberately not the same scale.
  const projectedValue =
    projectionView === "profit"
      ? projectedProfitTotal(lots, product.sellPrice)
      : toSellPrice(product.sellPrice);

  const lotsPanelId = `stock-product-${product.id}-lots`;

  return (
    <>
      <TableRow className="hover:bg-primary/5 transition-colors">
        <TableCell className="px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <ExpandRowButton
              expanded={isOpen}
              controlsId={lotsPanelId}
              label={`${isOpen ? "Collapse" : "Expand"} ${product.name}`}
              onToggle={() => setIsOpen((open) => !open)}
              iconClassName="h-5 w-5"
            >
              <TruncatedName
                className="text-body-sm-strong text-foreground"
                maxWidth={STOCK_NAME_MAX_WIDTH_PX}
              >
                {product.name}
              </TruncatedName>
            </ExpandRowButton>
            {!isReadOnly && (
              <EditProductModal product={product}>
                {(open) => (
                  <button
                    type="button"
                    onClick={open}
                    className="shrink-0 cursor-pointer text-caption text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Edit row
                  </button>
                )}
              </EditProductModal>
            )}
          </div>
        </TableCell>
        <TableCell className="px-6 py-4 text-right text-body-sm w-[250px] text-foreground">
          {totalStock} Units
        </TableCell>
        {!hideAmounts && (
          <TableCell className="px-6 py-4 text-right text-body-sm-strong w-[250px] text-foreground">
            ${totalValue.toFixed(2)}
          </TableCell>
        )}
        {showProjectionColumn && (
          <TableCell className="px-6 py-4 text-right text-body-sm-strong w-[250px]">
            {projectedValue === null ? (
              <CustomTooltip content="No sell price set for this product yet. Use “Edit row” to set one.">
                <span className="text-muted-foreground cursor-default">NA</span>
              </CustomTooltip>
            ) : (
              <span
                className={cn(
                  projectionView === "profit" && projectedValue < 0
                    ? "text-negative"
                    : "text-foreground",
                )}
              >
                {formatSignedAmount(projectedValue)}
              </span>
            )}
          </TableCell>
        )}
      </TableRow>

      {/* Expanded Content below row */}
      {isOpen && (
        <TableRow id={lotsPanelId} className="bg-primary/[0.06]">
          <TableCell
            colSpan={2 + (hideAmounts ? 0 : 1) + (showProjectionColumn ? 1 : 0)}
            className="p-0"
          >
            <div className="animate-in fade-in slide-in-from-top-2 duration-200 border-t border-primary/20">
              {/* Lot Sub-Header (desktop only) */}
              <div className="hidden md:flex md:items-center px-6 py-2 border-t border-primary/20 text-caption uppercase tracking-widest text-muted-foreground">
                <span className="flex-1">Lot Identity</span>
                <span className="w-[250px] text-right">
                  {hideAmounts ? "Quantity" : "Quantity & Unit Price"}
                </span>
                <span className="w-[250px] text-right">Status & Actions</span>
              </div>

              {/* Lot Cards */}
              {lots.map((lot) => (
                <LotCard
                  key={lot.id}
                  lot={lot}
                  productName={product.name}
                  onMarkStocked={handleMarkStocked}
                  onDelete={handleDelete}
                  onNotesUpdate={handleNotesUpdate}
                  isUpdating={isUpdating}
                />
              ))}

              {/* Row actions: Sell All + Add More Stock */}
              {!isReadOnly && (
                <div className="px-6 py-3 border-t border-primary/10 flex items-center gap-3">
                  {sellableStock > 0 && (
                    <SellAllModal product={product}>
                      {(open) => (
                        <Button type="button" size="sm" onClick={open}>
                          <ShoppingCart />
                          Sell all
                        </Button>
                      )}
                    </SellAllModal>
                  )}
                  <AddLotModal
                    productId={product.id}
                    productName={product.name}
                  >
                    {(open) => (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={open}
                      >
                        <Plus />
                        Add more stock
                      </Button>
                    )}
                  </AddLotModal>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function StockTable({
  products,
  currentPage = 1,
  totalCount = 0,
  totalPages = 1,
  pageSize = 10,
  onPageChange,
  isExternalPending = false,
  className,
}: StockTableProps) {
  const router = useRouter();
  const hideAmounts = useHideStockAmounts();
  const hideSellPrice = useHideSellPrice();
  const hideProjected = useHideProjectedProfit();

  // Which views this viewer is entitled to. Order matters: it decides the
  // default when no stored preference applies.
  const allowedViews = React.useMemo<ProjectionView[]>(() => {
    const views: ProjectionView[] = [];
    if (!hideProjected) views.push("profit");
    if (!hideSellPrice) views.push("sell");
    return views;
  }, [hideProjected, hideSellPrice]);

  const showProjectionColumn = allowedViews.length > 0;
  const {
    view: projectionView,
    toggle: toggleProjectionView,
    canSwap,
  } = useProjectionView(allowedViews);
  const [isPending, startTransition] = React.useTransition();
  const showSkeleton = isPending || isExternalPending;

  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
      return;
    }
    startTransition(() => {
      const params = new URLSearchParams(window.location.search);
      params.set("page", String(page));
      router.push(`/stock?${params.toString()}`, { scroll: false });
    });
  };

  if (products.length === 0 && !showSkeleton) {
    return (
      <div className="text-center py-16 bg-primary/5 rounded-2xl border border-primary/10">
        <Package className="w-12 h-12 text-primary/40 mx-auto mb-4" />
        <h3 className="font-display text-display-xs text-foreground mb-2">
          No Inventory Found
        </h3>
        <p className="text-muted-foreground text-body-sm max-w-md mx-auto">
          Add your first product to start tracking inventory and lots.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-card/50 backdrop-blur-md",
        className,
      )}
    >
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/20 border-b border-border text-muted-foreground text-caption uppercase hover:bg-muted/20">
            <TableHead className="px-6 py-4">Product</TableHead>
            <TableHead className="px-6 py-4 text-right w-[250px]">
              <span className="inline-flex items-center justify-end gap-2 w-full">
                <Package className="w-4 h-4 text-primary" />
                Total Stock
              </span>
            </TableHead>
            {!hideAmounts && (
              <TableHead className="px-6 py-4 text-right w-[250px]">
                <span className="inline-flex items-center justify-end gap-2 w-full">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Total Value
                </span>
              </TableHead>
            )}
            {showProjectionColumn && (
              <TableHead className="px-6 py-4 text-right w-[250px]">
                <span className="inline-flex items-center justify-end gap-2 w-full">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  {PROJECTION_LABEL[projectionView]}
                  {canSwap && (
                    <CustomTooltip
                      content={`Switch to ${
                        PROJECTION_LABEL[
                          projectionView === "profit" ? "sell" : "profit"
                        ]
                      }`}
                    >
                      <button
                        type="button"
                        onClick={toggleProjectionView}
                        aria-label={`Switch to ${
                          PROJECTION_LABEL[
                            projectionView === "profit" ? "sell" : "profit"
                          ]
                        }`}
                        className="p-1 -mr-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                      </button>
                    </CustomTooltip>
                  )}
                </span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {showSkeleton
            ? SKELETON_ROW_KEYS.map((key) => (
                <TableRow
                  key={key}
                  className="hover:bg-primary/5 transition-colors"
                >
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-5 h-5 rounded-md" />
                      <Skeleton className="h-5 w-48" />
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 w-[250px]">
                    <div className="flex justify-end">
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </TableCell>
                  {!hideAmounts && (
                    <TableCell className="px-6 py-4 w-[250px]">
                      <div className="flex justify-end">
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </TableCell>
                  )}
                  {showProjectionColumn && (
                    <TableCell className="px-6 py-4 w-[250px]">
                      <div className="flex justify-end">
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            : products.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  projectionView={projectionView}
                  showProjectionColumn={showProjectionColumn}
                />
              ))}
        </TableBody>
      </Table>

      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        unitLabel="products"
        isPending={showSkeleton}
        onPageChange={handlePageChange}
        className="border-t border-primary/10 py-4 sm:p-4"
      />
    </div>
  );
}
