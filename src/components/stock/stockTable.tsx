"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
  Package,
  DollarSign,
} from "lucide-react";
import { LotCard, type StockLot } from "@/components/stock/lotCard";
import { markAsStocked, deleteLot } from "@/actions/stock";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

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
            <span className="font-semibold text-foreground text-sm">
              {product.name}
            </span>
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

