"use client";

import { FormField, Input, Modal, ModalActions } from "@box-ds";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import * as React from "react";
import { toast } from "sonner";
import { sellLotUnits } from "@/actions/stock";
import { round2 } from "@/lib/formatting";

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
      toast.error("Please enter a valid sell price.");
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
      toast.error(
        error instanceof Error ? error.message : "Failed to sell units",
      );
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
            <p className="text-body-sm text-foreground/80 bg-primary/10 p-3 rounded-lg border border-primary/20">
              You are selling units from{" "}
              <strong className="text-foreground">{productName}</strong> (Lot{" "}
              <strong className="text-foreground">{lotRef}</strong>).
              <br />
              There are currently{" "}
              <strong className="text-primary">{lot.remainingQuantity}</strong>{" "}
              units available in stock.
            </p>
          </div>

          <FormField label="Quantity to Sell" htmlFor="quantity">
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              max={lot.remainingQuantity}
              value={quantity}
              onChange={handleQuantityChange}
              required
            />
          </FormField>

          <div className="space-y-3">
            <div className="flex flex-row gap-3 items-end">
              <FormField
                label="Sell Price (per unit)"
                htmlFor="perUnit"
                className="flex-1"
              >
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
                />
              </FormField>
              <div className="text-foreground/40 text-body-sm-strong pb-2.5 select-none">
                or
              </div>
              <FormField
                label="Sell Price (total)"
                htmlFor="total"
                className="flex-1"
              >
                <Input
                  id="total"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={total}
                  onChange={handleTotalChange}
                  onBlur={handleTotalBlur}
                  required
                />
              </FormField>
            </div>
            <p className="text-caption text-foreground/50">
              Edit either price — changing one will update the other.
            </p>
          </div>

          <ModalActions
            submitLabel="Confirm Sale"
            loadingLabel="Processing..."
            isLoading={isSubmitting}
            disabled={lot.remainingQuantity === 0}
            onCancel={() => setIsOpen(false)}
          />
        </form>
      </Modal>
    </>
  );
}
