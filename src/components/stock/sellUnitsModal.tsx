"use client";

import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import * as React from "react";
import { sellLotUnits } from "@/actions/stock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import type { StockLot } from "./lotCard";

interface SellUnitsModalProps {
  children: (open: () => void) => React.ReactNode;
  lot: StockLot;
  productName: string;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function SellUnitsModal({
  children,
  lot,
  productName,
}: SellUnitsModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const router = useRouter();

  const [quantity, setQuantity] = React.useState(lot.remainingQuantity);
  const [perUnit, setPerUnit] = React.useState(lot.buyPrice.toFixed(2));
  const [total, setTotal] = React.useState(
    (lot.remainingQuantity * lot.buyPrice).toFixed(2),
  );

  const lotRef = lot.lotIdentity || lot.id.slice(-6).toUpperCase();

  function resetForm() {
    setQuantity(lot.remainingQuantity);
    setPerUnit(lot.buyPrice.toFixed(2));
    setTotal((lot.remainingQuantity * lot.buyPrice).toFixed(2));
  }

  function handleOpen() {
    resetForm();
    setIsOpen(true);
  }

  function handleQuantityChange(e: React.ChangeEvent<HTMLInputElement>) {
    const qty = parseInt(e.target.value, 10);
    setQuantity(Number.isNaN(qty) ? 0 : qty);
    const per = parseFloat(perUnit);
    if (!Number.isNaN(qty) && qty > 0 && !Number.isNaN(per)) {
      setTotal((qty * per).toFixed(2));
    }
  }

  function handlePerUnitChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setPerUnit(val);
    const per = parseFloat(val);
    if (!Number.isNaN(per) && quantity > 0) {
      setTotal((quantity * per).toFixed(2));
    }
  }

  function handlePerUnitBlur() {
    const per = parseFloat(perUnit);
    if (!Number.isNaN(per)) {
      const rounded = round2(per);
      setPerUnit(rounded.toFixed(2));
      setTotal((quantity * rounded).toFixed(2));
    }
  }

  function handleTotalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setTotal(val);
    const tot = parseFloat(val);
    if (!Number.isNaN(tot) && quantity > 0) {
      setPerUnit((tot / quantity).toFixed(2));
    }
  }

  function handleTotalBlur() {
    const tot = parseFloat(total);
    if (!Number.isNaN(tot)) {
      const rounded = round2(tot);
      setTotal(rounded.toFixed(2));
      if (quantity > 0) {
        setPerUnit(round2(rounded / quantity).toFixed(2));
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const salePrice = round2(parseFloat(perUnit));
    if (Number.isNaN(salePrice) || salePrice <= 0) {
      alert("Please enter a valid sell price.");
      setIsSubmitting(false);
      return;
    }

    try {
      await sellLotUnits(lot.id, quantity, salePrice);
      posthog.capture("units_sold", {
        product_name: productName,
        quantity_sold: quantity,
        sale_price_per_unit: salePrice,
        total_sale_price: round2(quantity * salePrice),
      });
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to sell units:", error);
      alert(error instanceof Error ? error.message : "Failed to sell units");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {children(handleOpen)}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Sell Units"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <p className="text-sm text-foreground/80 leading-relaxed bg-primary/10 p-3 rounded-lg border border-primary/20">
              You are selling units from{" "}
              <strong className="text-foreground">{productName}</strong> (Lot{" "}
              <strong className="text-foreground">{lotRef}</strong>).
              <br />
              There are currently{" "}
              <strong className="text-primary">{lot.remainingQuantity}</strong>{" "}
              units available in stock.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-muted-foreground">
              Quantity to Sell
            </Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              max={lot.remainingQuantity}
              value={quantity}
              onChange={handleQuantityChange}
              required
              className="bg-background/50 border-primary/20 h-11"
            />
          </div>

          <div className="space-y-3">
            <div className="flex flex-row gap-3 items-end">
              <div className="space-y-2 flex-1">
                <Label htmlFor="perUnit" className="text-muted-foreground">
                  Sell Price (per unit)
                </Label>
                <Input
                  id="perUnit"
                  name="salePrice"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={perUnit}
                  onChange={handlePerUnitChange}
                  onBlur={handlePerUnitBlur}
                  required
                  className="bg-background/50 border-primary/20 h-11"
                />
              </div>
              <div className="text-foreground/40 text-sm font-medium pb-2.5 select-none">
                or
              </div>
              <div className="space-y-2 flex-1">
                <Label htmlFor="total" className="text-muted-foreground">
                  Sell Price (total)
                </Label>
                <Input
                  id="total"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={total}
                  onChange={handleTotalChange}
                  onBlur={handleTotalBlur}
                  required
                  className="bg-background/50 border-primary/20 h-11"
                />
              </div>
            </div>
            <p className="text-xs text-foreground/50">
              Edit either price — changing one will update the other.
            </p>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <Button
              type="submit"
              disabled={isSubmitting || lot.remainingQuantity === 0}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 cursor-pointer text-sm rounded-lg"
            >
              {isSubmitting ? "Processing..." : "Confirm Sale"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
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
