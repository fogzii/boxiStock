"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import DatePicker from "react-date-picker";
import { updateSale } from "@/actions/stock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

const MAX_NOTES_LENGTH = 50;

interface SaleItem {
  id: string;
  dateSold: string;
  createdAt: string;
  quantitySold: number;
  totalSalePrice: number;
  totalProfit: number;
  notes?: string | null;
  Product?: { name: string } | null;
}

interface EditSaleModalProps {
  sale: SaleItem;
  children: (open: () => void) => React.ReactNode;
}

export function EditSaleModal({ sale, children }: EditSaleModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const router = useRouter();

  const buyPricePerUnit =
    sale.quantitySold > 0
      ? (sale.totalSalePrice - sale.totalProfit) / sale.quantitySold
      : 0;
  const sellPricePerUnit =
    sale.quantitySold > 0 ? sale.totalSalePrice / sale.quantitySold : 0;

  const [quantity, setQuantity] = React.useState(String(sale.quantitySold));
  const [sellPrice, setSellPrice] = React.useState(sellPricePerUnit.toFixed(2));
  const [dateSold, setDateSold] = React.useState<Value>(
    new Date(sale.dateSold || sale.createdAt),
  );
  const [notes, setNotes] = React.useState(sale.notes ?? "");

  const parsedQty = Math.max(1, Math.floor(parseFloat(quantity) || 1));
  const parsedSell = Math.max(0, parseFloat(sellPrice) || 0);
  const previewTotal = Math.round(parsedQty * parsedSell * 100) / 100;
  const previewProfit =
    Math.round((previewTotal - parsedQty * buyPricePerUnit) * 100) / 100;

  const resetForm = () => {
    setQuantity(String(sale.quantitySold));
    setSellPrice(sellPricePerUnit.toFixed(2));
    setDateSold(new Date(sale.dateSold || sale.createdAt));
    setNotes(sale.notes ?? "");
  };

  const handleClose = () => {
    resetForm();
    setIsOpen(false);
  };

  const handleQuantityBlur = () => {
    const n = Math.floor(parseFloat(quantity));
    setQuantity(String(Number.isFinite(n) && n >= 1 ? n : sale.quantitySold));
  };

  const handleSellPriceBlur = () => {
    const n = parseFloat(sellPrice);
    if (Number.isFinite(n) && n >= 0) {
      setSellPrice((Math.round(n * 100) / 100).toFixed(2));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateSale(sale.id, {
        quantitySold: parsedQty,
        salePricePerUnit: parsedSell,
        dateSold: dateSold as Date,
        notes,
      });
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update sale");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <>
      {children(() => setIsOpen(true))}
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={`Edit Sale — ${sale.Product?.name ?? "Unknown Product"}`}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm text-foreground/80 leading-relaxed">
            Buy price is{" "}
            <strong className="text-foreground">
              {formatter.format(buyPricePerUnit)}
            </strong>{" "}
            per unit and is fixed — only quantity and sell price affect profit.
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="es-quantity" className="text-muted-foreground">
                  Quantity Sold
                </Label>
                <Input
                  id="es-quantity"
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
                <Label htmlFor="es-sellPrice" className="text-muted-foreground">
                  Sell Price (per unit)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="es-sellPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    onBlur={handleSellPriceBlur}
                    required
                    className="pl-7 bg-background/50 border-primary/20 h-11"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 flex flex-col">
              <Label className="text-muted-foreground">Date Sold</Label>
              <DatePicker
                onChange={setDateSold}
                value={dateSold}
                className="w-full bg-background/50 dark:bg-input/30 border border-primary/20 h-11 rounded-md [color-scheme:dark] flex items-center text-sm"
                clearIcon={null}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="es-notes" className="text-muted-foreground">
                Notes{" "}
                <span className="text-muted-foreground/50 font-normal">
                  (optional, max 50 chars)
                </span>
              </Label>
              <div className="relative">
                <Input
                  id="es-notes"
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

            {/* Live preview */}
            <div className="grid grid-cols-2 gap-3 text-sm bg-muted/20 rounded-lg p-3 border border-border/50">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  Total Sell
                </p>
                <p className="font-semibold text-primary">
                  {formatter.format(previewTotal)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  Net Profit
                </p>
                <p
                  className={`font-semibold ${previewProfit >= 0 ? "text-emerald-400" : "text-destructive"}`}
                >
                  {previewProfit >= 0 ? "+" : ""}
                  {formatter.format(previewProfit)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-2">
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
