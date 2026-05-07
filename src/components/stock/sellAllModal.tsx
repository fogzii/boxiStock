"use client";

import { Loader2, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import DatePicker from "react-date-picker";
import { toast } from "sonner";
import { createBundle } from "@/actions/stock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import type { ProductWithLots } from "./stockTable";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

interface SellAllModalProps {
  product: ProductWithLots;
  children: (open: () => void) => React.ReactNode;
}

export function SellAllModal({ product, children }: SellAllModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [sellPriceStr, setSellPriceStr] = React.useState("");
  const [dateSold, setDateSold] = React.useState<Value>(new Date());
  const router = useRouter();

  const totalQty = product.lots.reduce((s, l) => s + l.remainingQuantity, 0);
  const totalBuyCost = round2(
    product.lots.reduce((s, l) => s + l.remainingQuantity * l.buyPrice, 0),
  );

  const sellPrice = parseFloat(sellPriceStr) || 0;
  const totalProfit = round2(sellPrice - totalBuyCost);

  const canSubmit =
    sellPriceStr !== "" && sellPrice >= 0 && totalQty > 0 && !isSubmitting;

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  function handleOpen() {
    setSellPriceStr("");
    setDateSold(new Date());
    setIsOpen(true);
  }

  function handleClose() {
    setSellPriceStr("");
    setDateSold(new Date());
    setIsOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await createBundle({
        name: product.name,
        totalSellPrice: round2(sellPrice),
        dateSold: dateSold instanceof Date ? dateSold : new Date(),
        items: [{ productId: product.id, quantity: totalQty }],
      });
      toast.success(`Sold all ${totalQty} units of "${product.name}".`);
      handleClose();
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to record sale.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {children(handleOpen)}
      <Modal isOpen={isOpen} onClose={handleClose} title="Sell All Stock">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="space-y-5">
            {/* Product summary */}
            <div className="rounded-lg border border-primary/20 bg-background/50 divide-y divide-primary/10">
              <div className="flex items-center justify-between px-4 h-11">
                <span className="text-sm text-muted-foreground">Product</span>
                <span className="text-sm font-medium text-foreground">
                  {product.name}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 h-11">
                <span className="text-sm text-muted-foreground">Total qty</span>
                <span className="text-sm font-medium text-foreground">
                  {totalQty} units
                </span>
              </div>
              <div className="flex items-center justify-between px-4 h-11">
                <span className="text-sm text-muted-foreground">
                  Total buy cost
                </span>
                <span className="text-sm font-medium text-foreground">
                  {formatter.format(totalBuyCost)}
                </span>
              </div>
            </div>

            {/* Sell price */}
            <div className="space-y-2">
              <Label htmlFor="sell-all-price" className="text-muted-foreground">
                Sell Price
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                  $
                </span>
                <Input
                  id="sell-all-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={sellPriceStr}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                      setSellPriceStr(val);
                    }
                  }}
                  onBlur={() => {
                    const n = parseFloat(sellPriceStr);
                    if (Number.isFinite(n))
                      setSellPriceStr(round2(n).toFixed(2));
                  }}
                  placeholder="0.00"
                  className="bg-background/50 border-primary/20 h-11 pl-7"
                  required
                />
              </div>
            </div>

            {/* Profit preview */}
            {sellPriceStr !== "" && (
              <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-background/50 px-4 h-11">
                <span className="text-sm text-muted-foreground">
                  Net profit
                </span>
                <span
                  className={`text-sm font-bold ${totalProfit >= 0 ? "text-emerald-400" : "text-destructive"}`}
                >
                  {totalProfit >= 0 ? "+" : ""}
                  {formatter.format(totalProfit)}
                </span>
              </div>
            )}

            {/* Date sold */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Date Sold</Label>
              <div className="w-full flex">
                <DatePicker
                  onChange={setDateSold}
                  value={dateSold}
                  className="w-full bg-background/50 dark:bg-input/30 border border-primary/20 h-11 rounded-md [color-scheme:dark] flex items-center text-sm"
                  clearIcon={null}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row-reverse gap-3 mt-4">
            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full sm:w-auto h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 cursor-pointer text-sm rounded-lg sm:px-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Sell All {totalQty} Units
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto h-12 cursor-pointer text-sm rounded-lg hover:bg-white/5"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
