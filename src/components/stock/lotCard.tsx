"use client";

import * as React from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CustomTooltip } from "@/components/ui/tooltip";
import { Tag, PackageCheck, Trash2, ShoppingCart } from "lucide-react";

export type StockLot = {
  id: string;
  initialQuantity: number;
  remainingQuantity: number;
  buyPrice: number;
  isStocked: boolean;
  dateAcquired: Date;
  lotIdentity?: string | null;
};

interface LotCardProps {
  lot: StockLot;
  onMarkStocked: (lotId: string) => Promise<void>;
  onDelete: (lotId: string) => Promise<void>;
  isUpdating: string | null;
}

export function LotCard({
  lot,
  onMarkStocked,
  onDelete,
  isUpdating,
}: LotCardProps) {
  const lotRef = lot.lotIdentity || lot.id.slice(-6).toUpperCase();
  const totalValue = lot.remainingQuantity * lot.buyPrice;
  const isProcessing = isUpdating === lot.id;

  return (
    <div className="flex flex-row flex-nowrap items-center gap-4 md:gap-0 px-5 py-4 border-t border-border/50 hover:bg-primary/5 transition-colors">
      {/* Lot Identity */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="p-1.5 rounded-lg bg-primary/10 text-primary mt-0.5">
          <Tag className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">
              {lot.lotIdentity ? lot.lotIdentity : `Lot #${lotRef}`}
            </p>
            <Badge
              variant={lot.isStocked ? "default" : "secondary"}
              className={
                lot.isStocked
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20 px-1.5 py-0 text-[10px]"
                  : "bg-amber-500/15 text-amber-400 border-amber-500/20 px-1.5 py-0 text-[10px]"
              }
            >
              {lot.isStocked ? "In Stock" : "Pending"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {lot.isStocked ? "Received" : "Created"}{" "}
            {format(new Date(lot.dateAcquired), "MMM dd, yyyy")}
          </p>
        </div>
      </div>

      {/* Quantity & Unit Price */}
      <div className="w-[250px] text-right">
        <p className="text-sm font-medium text-foreground">
          {lot.remainingQuantity} units @ ${lot.buyPrice.toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground">
          ${totalValue.toFixed(2)} Total
        </p>
      </div>

      {/* Status & Actions */}
      <div className="flex items-center gap-2 w-[250px] justify-end flex-wrap">
        {!lot.isStocked && (
          <CustomTooltip
            content={
              <span>
                Click to move the item status into{" "}
                <code className="bg-primary/20 text-primary px-1 py-0.5 rounded font-mono text-[10px]">
                  in stock
                </code>
              </span>
            }
          >
            <Button
              size="sm"
              onClick={() => onMarkStocked(lot.id)}
              disabled={isProcessing}
              className="bg-primary/20 hover:bg-primary/30 text-primary border-none cursor-pointer"
            >
              <PackageCheck className="w-3.5 h-3.5 mr-1" />
              {isProcessing ? "..." : "Stocked"}
            </Button>
          </CustomTooltip>
        )}

        {lot.isStocked && (
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            disabled
          >
            <ShoppingCart className="w-3.5 h-3.5 mr-1" />
            Sell
          </Button>
        )}

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(lot.id)}
          disabled={isProcessing}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

