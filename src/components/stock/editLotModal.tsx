"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import DatePicker from "react-date-picker";
import { updateLot } from "@/actions/stock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { StockLot } from "./lotCard";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

const MAX_NOTES_LENGTH = 75;

interface EditLotModalProps {
  lot: StockLot;
  productName: string;
  children: (open: () => void) => React.ReactNode;
}

export function EditLotModal({
  lot,
  productName,
  children,
}: EditLotModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isStocked, setIsStocked] = React.useState(lot.isStocked);
  const [dateAcquired, setDateAcquired] = React.useState<Value>(
    new Date(lot.dateAcquired),
  );
  const [quantity, setQuantity] = React.useState(String(lot.remainingQuantity));
  const [buyPrice, setBuyPrice] = React.useState(lot.buyPrice.toFixed(2));
  const [lotIdentity, setLotIdentity] = React.useState(lot.lotIdentity ?? "");
  const [notes, setNotes] = React.useState(lot.notes ?? "");
  const router = useRouter();

  const lotRef = lot.lotIdentity || lot.id.slice(-6).toUpperCase();

  const resetForm = () => {
    setIsStocked(lot.isStocked);
    setDateAcquired(new Date(lot.dateAcquired));
    setQuantity(String(lot.remainingQuantity));
    setBuyPrice(lot.buyPrice.toFixed(2));
    setLotIdentity(lot.lotIdentity ?? "");
    setNotes(lot.notes ?? "");
  };

  const handleClose = () => {
    resetForm();
    setIsOpen(false);
  };

  const handleQuantityBlur = () => {
    const n = Math.floor(parseFloat(quantity));
    setQuantity(
      String(Number.isFinite(n) && n >= 1 ? n : lot.remainingQuantity),
    );
  };

  const handleBuyPriceBlur = () => {
    const n = parseFloat(buyPrice);
    if (Number.isFinite(n)) {
      setBuyPrice((Math.round(n * 100) / 100).toFixed(2));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const parsedQty = Math.floor(parseFloat(quantity));
    const parsedPrice = Math.round(parseFloat(buyPrice) * 100) / 100;

    try {
      await updateLot(lot.id, {
        remainingQuantity: parsedQty,
        buyPrice: parsedPrice,
        isStocked,
        dateAcquired: dateAcquired as Date,
        lotIdentity,
        notes,
      });
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to update lot:", error);
      alert(error instanceof Error ? error.message : "Failed to update lot");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {children(() => setIsOpen(true))}
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={`Edit Lot — ${productName}`}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <p className="text-sm text-foreground/80 leading-relaxed bg-primary/10 p-3 rounded-lg border border-primary/20">
            Editing{" "}
            <strong className="text-foreground">
              {lot.lotIdentity ? lot.lotIdentity : `Lot #${lotRef}`}
            </strong>
            . Initial quantity was{" "}
            <strong className="text-primary">{lot.initialQuantity}</strong>{" "}
            units.
          </p>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="edit-quantity"
                  className="text-muted-foreground"
                >
                  Remaining Quantity
                </Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  onBlur={handleQuantityBlur}
                  required
                  className="bg-background/50 border-primary/20 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="edit-buyPrice"
                  className="text-muted-foreground"
                >
                  Unit Buy Price
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="edit-buyPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    onBlur={handleBuyPriceBlur}
                    required
                    className="pl-7 bg-background/50 border-primary/20 h-11"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 flex flex-col">
                <Label className="text-muted-foreground">Date Acquired</Label>
                <div className="w-full flex">
                  <DatePicker
                    onChange={setDateAcquired}
                    value={dateAcquired}
                    className="w-full bg-background/50 dark:bg-input/30 border border-primary/20 h-11 rounded-md [color-scheme:dark] flex items-center text-sm"
                    clearIcon={null}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="edit-lotIdentity"
                  className="text-muted-foreground"
                >
                  Lot Identity
                </Label>
                <Input
                  id="edit-lotIdentity"
                  value={lotIdentity}
                  onChange={(e) => setLotIdentity(e.target.value)}
                  placeholder="e.g. L-20260430-143052"
                  className="bg-background/50 border-primary/20 h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Status</Label>
              <div className="flex p-1 bg-background/50 border border-primary/20 rounded-lg">
                <button
                  type="button"
                  onClick={() => setIsStocked(true)}
                  className={cn(
                    "flex-1 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer",
                    isStocked
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  In Hand
                </button>
                <button
                  type="button"
                  onClick={() => setIsStocked(false)}
                  className={cn(
                    "flex-1 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer",
                    !isStocked
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Pending
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes" className="text-muted-foreground">
                Notes{" "}
                <span className="text-muted-foreground/50 font-normal">
                  (optional, max 75 chars)
                </span>
              </Label>
              <div className="relative">
                <Input
                  id="edit-notes"
                  value={notes}
                  onChange={(e) =>
                    setNotes(e.target.value.slice(0, MAX_NOTES_LENGTH))
                  }
                  maxLength={MAX_NOTES_LENGTH}
                  placeholder="Add notes..."
                  className="bg-background/50 border-primary/20 h-11 pr-14"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground/40 tabular-nums pointer-events-none">
                  {notes.length}/{MAX_NOTES_LENGTH}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 cursor-pointer text-sm rounded-lg"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="w-full h-12 cursor-pointer text-sm rounded-lg hover:bg-white/5"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
