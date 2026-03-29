"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
  Package,
  DollarSign,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { LotCard, type StockLot } from "@/components/stock/lotCard";
import { markAsStocked, deleteLot, updateProductName } from "@/actions/stock";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type ProductWithLots = {
  id: string;
  name: string;
  lots: StockLot[];
};

interface StockTableProps {
  products: ProductWithLots[];
}

function ProductRow({ product }: { product: ProductWithLots }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [lots, setLots] = React.useState(product.lots);
  const [isUpdating, setIsUpdating] = React.useState<string | null>(null);
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [editedName, setEditedName] = React.useState(product.name);
  const router = useRouter();

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

  return (
    <>
      {/* Collapsed Product Row in table */}
      <TableRow
        className="cursor-pointer hover:bg-primary/5 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <TableCell className="px-5 py-2">
          <div className="flex items-center gap-3">
            {isOpen ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            )}
            {isEditingName ? (
              <div 
                className="flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="h-7 text-sm font-semibold max-w-[200px]"
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
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingName(false);
                    setEditedName(product.name);
                  }}
                  disabled={isUpdating === "name"}
                  className="p-1 hover:bg-destructive/10 rounded-md transition-colors text-destructive"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group/name">
                <span className="font-semibold text-foreground text-sm">
                  {product.name}
                </span>
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
              </div>
            )}
          </div>
        </TableCell>
        <TableCell className="px-5 py-2 text-right text-sm text-foreground w-[250px]">
          {totalStock} Units
        </TableCell>
        <TableCell className="px-5 py-2 text-right text-sm font-semibold text-foreground w-[250px]">
          ${totalValue.toFixed(2)}
        </TableCell>
      </TableRow>

      {/* Expanded Content below row */}
      {isOpen && (
        <TableRow className="bg-primary/[0.02]">
          <TableCell colSpan={3} className="p-0">
            <div className="animate-in fade-in slide-in-from-top-2 duration-200 border-t border-border/30">
              {/* Lot Sub-Header (desktop only) */}
              <div className="hidden md:flex md:items-center px-5 py-2 border-t border-border/30 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
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
                  isUpdating={isUpdating}
                />
              ))}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function StockTable({ products }: StockTableProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16 bg-primary/5 rounded-2xl border border-primary/10">
        <Package className="w-12 h-12 text-primary/40 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No Inventory Found
        </h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Add your first product to start tracking inventory and lots.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-primary/10 overflow-hidden bg-background shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-primary/5 text-muted-foreground text-xs uppercase tracking-widest font-bold hover:bg-primary/5">
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
          {products.map((product) => (
            <ProductRow key={product.id} product={product} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

