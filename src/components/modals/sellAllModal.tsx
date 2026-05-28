"use client";

import {
  Button,
  CurrencyInput,
  DatePickerInput,
  FormField,
  Modal,
} from "@box-ds";
import { Loader2, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { sellAllLots } from "@/actions/stock/inventory";
import type { ProductWithLots } from "@/components/stock/stockTable";
import { formatCurrency, round2 } from "@/lib/formatting";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

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
      await sellAllLots(
        product.id,
        round2(sellPrice),
        dateSold instanceof Date ? dateSold : new Date(),
      );
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
                <span className="text-body-sm text-muted-foreground">
                  Product
                </span>
                <span className="text-body-sm-strong text-foreground">
                  {product.name}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 h-11">
                <span className="text-body-sm text-muted-foreground">
                  Total qty
                </span>
                <span className="text-body-sm-strong text-foreground">
                  {totalQty} units
                </span>
              </div>
              <div className="flex items-center justify-between px-4 h-11">
                <span className="text-body-sm text-muted-foreground">
                  Total buy cost
                </span>
                <span className="text-body-sm-strong text-foreground">
                  {formatCurrency(totalBuyCost)}
                </span>
              </div>
            </div>

            {/* Sell price */}
            <FormField label="Sell Price" htmlFor="sell-all-price">
              <CurrencyInput
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
                  if (Number.isFinite(n)) setSellPriceStr(round2(n).toFixed(2));
                }}
                placeholder="0.00"
                required
              />
            </FormField>

            {/* Profit preview */}
            {sellPriceStr !== "" && (
              <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-background/50 px-4 h-11">
                <span className="text-body-sm text-muted-foreground">
                  Net profit
                </span>
                <span
                  className={`text-body-sm-strong ${totalProfit >= 0 ? "text-positive" : "text-destructive"}`}
                >
                  {totalProfit >= 0 ? "+" : ""}
                  {formatCurrency(totalProfit)}
                </span>
              </div>
            )}

            {/* Date sold */}
            <FormField label="Date Sold">
              <div className="w-full flex">
                <DatePickerInput onChange={setDateSold} value={dateSold} />
              </div>
            </FormField>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row-reverse gap-3 mt-4">
            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full sm:w-auto h-12 shadow-glow-subtle sm:px-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  Sell All {totalQty} Units
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto h-12 hover:bg-primary/5"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
