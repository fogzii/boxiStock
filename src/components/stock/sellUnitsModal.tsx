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

export function SellUnitsModal({
  children,
  lot,
  productName,
}: SellUnitsModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const router = useRouter();

  const lotRef = lot.lotIdentity || lot.id.slice(-6).toUpperCase();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const quantity = parseInt(formData.get("quantity") as string, 10);
    const salePrice = parseFloat(formData.get("salePrice") as string);

    try {
      await sellLotUnits(lot.id, quantity, salePrice);
      posthog.capture("units_sold", {
        product_name: productName,
        quantity_sold: quantity,
        sale_price_per_unit: salePrice,
        total_sale_price: quantity * salePrice,
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
      {children(() => setIsOpen(true))}
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
          <div className="flex flex-col md:flex-row gap-4">
            <div className="space-y-2 flex-1">
              <Label htmlFor="quantity">Quantity to Sell</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                max={lot.remainingQuantity}
                defaultValue={lot.remainingQuantity}
                required
                className="bg-background border-border/50"
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="salePrice">Sell Price (per unit)</Label>
              <Input
                id="salePrice"
                name="salePrice"
                type="number"
                min="0.01"
                step="0.01"
                defaultValue={lot.buyPrice.toFixed(2)}
                required
                className="bg-background border-border/50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || lot.remainingQuantity === 0}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold cursor-pointer"
            >
              {isSubmitting ? "Processing..." : "Confirm Sale"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
