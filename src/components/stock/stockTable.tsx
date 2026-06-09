"use client";

import {
  Button,
  Input,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@box-ds";
import {
  Check,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Edit2,
  Package,
  Plus,
  ShoppingCart,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import {
  deleteLot,
  markAsStocked,
  updateLotNotes,
  updateProductName,
} from "@/actions/stock/inventory";
import { AddLotModal } from "@/components/modals/addLotModal";
import { SellAllModal } from "@/components/modals/sellAllModal";
import { LotCard } from "@/components/stock/lotCard";
import { ScrollRestorer } from "@/components/ui/ScrollRestorer";
import { TablePagination } from "@/components/ui/TablePagination";
import { useReadOnly } from "@/lib/context/readOnly";
import type { ProductWithLots } from "@/lib/stock/types";
import { cn } from "@/lib/utils";
import { StockStatusBadge } from "./StockStatusBadge";

export type { ProductWithLots } from "@/lib/stock/types";

interface StockTableProps {
  products: ProductWithLots[];
  currentPage?: number;
  totalCount?: number;
  totalPages?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  isExternalPending?: boolean;
}

const SKELETON_ROW_KEYS = Array.from(
  { length: 10 },
  (_, i) => `stock-skeleton-${i}`,
);

function ProductRow({ product }: { product: ProductWithLots }) {
  const isReadOnly = useReadOnly();
  const [isOpen, setIsOpen] = React.useState(false);
  const [lots, setLots] = React.useState(product.lots);
  const [isUpdating, setIsUpdating] = React.useState<string | null>(null);
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [editedName, setEditedName] = React.useState(product.name);
  const router = useRouter();

  React.useEffect(() => {
    setLots(product.lots);
  }, [product.lots]);

  const handleEditName = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!editedName.trim() || editedName === product.name) {
      setIsEditingName(false);
      setEditedName(product.name);
      return;
    }
    try {
      setIsUpdating("name");
      await updateProductName(product.id, editedName);
      setIsEditingName(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to update name:", error);
    } finally {
      setIsUpdating(null);
    }
  };

  const totalStock = lots.reduce(
    (acc, lot) => (lot.isStocked ? acc + lot.remainingQuantity : acc),
    0,
  );

  const totalValue = lots.reduce(
    (acc, lot) =>
      lot.isStocked ? acc + lot.remainingQuantity * lot.buyPrice : acc,
    0,
  );

  const pendingStock = lots.reduce(
    (acc, lot) => (!lot.isStocked ? acc + lot.remainingQuantity : acc),
    0,
  );

  const pendingValue = lots.reduce(
    (acc, lot) =>
      !lot.isStocked ? acc + lot.remainingQuantity * lot.buyPrice : acc,
    0,
  );

  const hasPending = pendingStock > 0;
  const showPendingTotals = totalStock === 0 && hasPending;

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

  return (
    <>
      {/* Collapsed Product Row in table */}
      <TableRow
        className="cursor-pointer hover:bg-primary/5 transition-colors"
        onClick={() => {
          if (isEditingName) return;
          setIsOpen(!isOpen);
        }}
      >
        <TableCell className="px-5 py-4">
          <div className="flex items-center gap-3">
            {isOpen ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            )}
            {isUpdating === "name" ? (
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-32" />
              </div>
            ) : isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="h-7 text-body-sm-strong max-w-[200px]"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEditName();
                    if (e.key === "Escape") {
                      setIsEditingName(false);
                      setEditedName(product.name);
                    }
                  }}
                  disabled={isUpdating === "name"}
                />
                <button
                  type="button"
                  onClick={handleEditName}
                  disabled={isUpdating === "name"}
                  className="p-1 hover:bg-primary/10 rounded-md transition-colors text-primary"
                >
                  <Check className="w-4 h-4" />
                </button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditingName(false);
                    setEditedName(product.name);
                  }}
                  disabled={isUpdating === "name"}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group/name">
                <span className="text-body-sm-strong text-foreground">
                  {product.name}
                </span>
                {hasPending && <StockStatusBadge isStocked={false} />}
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingName(true);
                    }}
                    className="p-1 hover:bg-primary/10 rounded-md transition-all text-muted-foreground hover:text-primary"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </TableCell>
        <TableCell
          className={cn(
            "px-5 py-4 text-right text-body-sm w-[250px]",
            showPendingTotals ? "text-warning" : "text-foreground",
          )}
        >
          {showPendingTotals ? pendingStock : totalStock} Units
        </TableCell>
        <TableCell
          className={cn(
            "px-5 py-4 text-right text-body-sm-strong w-[250px]",
            showPendingTotals ? "text-warning" : "text-foreground",
          )}
        >
          ${(showPendingTotals ? pendingValue : totalValue).toFixed(2)}
        </TableCell>
      </TableRow>

      {/* Expanded Content below row */}
      {isOpen && (
        <TableRow className="bg-primary/[0.06]">
          <TableCell colSpan={3} className="p-0">
            <div className="animate-in fade-in slide-in-from-top-2 duration-200 border-t border-primary/20">
              {/* Lot Sub-Header (desktop only) */}
              <div className="hidden md:flex md:items-center px-5 py-2 border-t border-primary/20 text-caption uppercase tracking-widest text-muted-foreground">
                <span className="flex-1">Lot Identity</span>
                <span className="w-[250px] text-right">
                  Quantity & Unit Price
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
                <div className="px-5 py-3 border-t border-primary/10 flex items-center gap-3">
                  {totalStock > 0 && (
                    <SellAllModal product={product}>
                      {(open) => (
                        <button
                          type="button"
                          onClick={open}
                          className="flex items-center gap-2 text-caption text-primary-foreground bg-primary hover:bg-primary-active px-3 py-1.5 rounded-md transition-all"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Sell all
                        </button>
                      )}
                    </SellAllModal>
                  )}
                  <AddLotModal
                    productId={product.id}
                    productName={product.name}
                  >
                    {(open) => (
                      <button
                        type="button"
                        onClick={open}
                        className="flex items-center gap-2 text-caption text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 px-3 py-1.5 rounded-md transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add more stock
                      </button>
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
}: StockTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const showSkeleton = isPending || isExternalPending;

  const handlePageChange = (page: number) => {
    startTransition(() => {
      if (onPageChange) {
        onPageChange(page);
      } else {
        const params = new URLSearchParams(window.location.search);
        params.set("page", String(page));
        router.push(`/stock?${params.toString()}`);
      }
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
    <div className="rounded-2xl border border-primary/10 overflow-hidden bg-background shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-primary/5 text-muted-foreground text-caption uppercase tracking-widest hover:bg-primary/5">
            <TableHead className="px-5 py-2">Product</TableHead>
            <TableHead className="px-5 py-2 text-right w-[250px]">
              <span className="inline-flex items-center justify-end gap-2 w-full">
                <Package className="w-4 h-4 text-primary" />
                Total Stock
              </span>
            </TableHead>
            <TableHead className="px-5 py-2 text-right w-[250px]">
              <span className="inline-flex items-center justify-end gap-2 w-full">
                <DollarSign className="w-4 h-4 text-primary" />
                Total Value
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {showSkeleton
            ? SKELETON_ROW_KEYS.map((key) => (
                <TableRow
                  key={key}
                  className="hover:bg-primary/5 transition-colors"
                >
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-5 h-5 rounded-md" />
                      <Skeleton className="h-5 w-48" />
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4 w-[250px]">
                    <div className="flex justify-end">
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4 w-[250px]">
                    <div className="flex justify-end">
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            : products.map((product) => (
                <ProductRow key={product.id} product={product} />
              ))}
        </TableBody>
      </Table>

      <ScrollRestorer scrollKey="stock" />
      <TablePagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        unitLabel="products"
        isPending={showSkeleton}
        onPageChange={handlePageChange}
        scrollKey="stock"
        className="p-4 border-t border-primary/10"
      />
    </div>
  );
}
