"use client";

import { format } from "date-fns";
import {
  Check,
  PackageCheck,
  Pencil,
  ShoppingCart,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CustomTooltip } from "@/components/ui/tooltip";
import { DeleteUnitsModal } from "./deleteUnitsModal";
import { SellUnitsModal } from "./sellUnitsModal";

export type StockLot = {
  id: string;
  initialQuantity: number;
  remainingQuantity: number;
  buyPrice: number;
  isStocked: boolean;
  dateAcquired: Date;
  lotIdentity?: string | null;
  notes?: string | null;
};

const MAX_NOTES_LENGTH = 50;

interface LotCardProps {
  lot: StockLot;
  productName: string;
  onMarkStocked: (lotId: string) => Promise<void>;
  onDelete: (lotId: string) => Promise<void>;
  onNotesUpdate: (lotId: string, notes: string | null) => Promise<void>;
  isUpdating: string | null;
}

export function LotCard({
  lot,
  productName,
  onMarkStocked,
  onDelete: _onDelete,
  onNotesUpdate,
  isUpdating,
}: LotCardProps) {
  const lotRef = lot.lotIdentity || lot.id.slice(-6).toUpperCase();
  const totalValue = lot.remainingQuantity * lot.buyPrice;
  const isProcessing = isUpdating === lot.id;

  const [isEditingNotes, setIsEditingNotes] = React.useState(false);
  const [notesValue, setNotesValue] = React.useState(lot.notes ?? "");
  const [isSavingNotes, setIsSavingNotes] = React.useState(false);
  const notesInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setNotesValue(lot.notes ?? "");
  }, [lot.notes]);

  React.useEffect(() => {
    if (isEditingNotes) {
      notesInputRef.current?.focus();
    }
  }, [isEditingNotes]);

  const handleSaveNotes = async () => {
    const trimmed = notesValue.trim();
    const newNotes = trimmed.length > 0 ? trimmed : null;
    if (newNotes === (lot.notes ?? null)) {
      setIsEditingNotes(false);
      return;
    }
    try {
      setIsSavingNotes(true);
      await onNotesUpdate(lot.id, newNotes);
    } catch {
      setNotesValue(lot.notes ?? "");
    } finally {
      setIsSavingNotes(false);
      setIsEditingNotes(false);
    }
  };

  const handleCancelNotes = () => {
    setNotesValue(lot.notes ?? "");
    setIsEditingNotes(false);
  };

  return (
    <div className="border-t border-border/50 hover:bg-primary/5 transition-colors">
      {/* Main lot row */}
      <div className="flex flex-row flex-nowrap items-center gap-4 md:gap-0 px-5 py-3">
        {/* Lot Identity */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary mt-0.5">
            <Tag className="w-4 h-4" />
          </div>
          <div className="flex flex-col gap-1">
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
        <div className="w-[250px] text-right flex flex-col gap-1">
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
            <SellUnitsModal lot={lot} productName={productName}>
              {(open) => (
                <Button
                  size="sm"
                  onClick={open}
                  className="bg-primary/20 hover:bg-primary/30 text-primary border-none cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                  Sell
                </Button>
              )}
            </SellUnitsModal>
          )}

          <DeleteUnitsModal lot={lot} productName={productName}>
            {(open) => (
              <Button
                size="sm"
                variant="ghost"
                onClick={open}
                disabled={isProcessing}
                className="text-muted-foreground hover:text-destructive cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </DeleteUnitsModal>
        </div>
      </div>

      {/* Notes row — always visible */}
      <div className="px-5 pb-3 pl-[52px]">
        {isEditingNotes ? (
          <div className="flex items-center gap-1.5">
            <input
              ref={notesInputRef}
              type="text"
              value={notesValue}
              onChange={(e) =>
                setNotesValue(e.target.value.slice(0, MAX_NOTES_LENGTH))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveNotes();
                if (e.key === "Escape") handleCancelNotes();
              }}
              disabled={isSavingNotes}
              maxLength={MAX_NOTES_LENGTH}
              placeholder="Add a short note..."
              className="h-6 flex-1 max-w-[260px] text-xs bg-primary/5 border border-primary/20 rounded px-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
            />
            <span className="text-[10px] text-muted-foreground/40 tabular-nums">
              {notesValue.length}/{MAX_NOTES_LENGTH}
            </span>
            <button
              type="button"
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
              className="p-0.5 hover:bg-primary/10 rounded transition-colors text-primary"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleCancelNotes}
              disabled={isSavingNotes}
              className="p-0.5 hover:bg-destructive/10 rounded transition-colors text-muted-foreground hover:text-destructive"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingNotes(true)}
            className="group/notes flex items-center gap-1.5 text-xs transition-colors"
          >
            {lot.notes ? (
              <>
                <Pencil className="w-3 h-3 text-muted-foreground/40 group-hover/notes:text-primary/60 transition-colors shrink-0" />
                <span className="italic text-muted-foreground/70 group-hover/notes:text-muted-foreground transition-colors">
                  {lot.notes}
                </span>
              </>
            ) : (
              <>
                <Pencil className="w-3 h-3 text-muted-foreground/30 group-hover/notes:text-primary/50 transition-colors shrink-0" />
                <span className="text-muted-foreground/30 group-hover/notes:text-muted-foreground/60 transition-colors">
                  Add note...
                </span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
