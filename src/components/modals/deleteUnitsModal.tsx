"use client";

import { FormField, Input, Modal, ModalActions } from "@box-ds";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import * as React from "react";
import { toast } from "sonner";
import { deleteLotUnits } from "@/actions/stock";
import type { StockLot } from "@/components/stock/lotCard";

interface DeleteUnitsModalProps {
  children: (open: () => void) => React.ReactNode;
  lot: StockLot;
  productName: string;
}

export function DeleteUnitsModal({
  children,
  lot,
  productName,
}: DeleteUnitsModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const router = useRouter();

  const lotRef = lot.lotIdentity || lot.id.slice(-6).toUpperCase();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const quantity = parseInt(formData.get("quantity") as string, 10);

    try {
      await deleteLotUnits(lot.id, quantity);
      posthog.capture("units_deleted", {
        product_name: productName,
        quantity_deleted: quantity,
      });
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete units",
      );
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
        title="Delete Units"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <p className="text-body-sm text-foreground/80 bg-negative-bg p-3 rounded-lg border border-negative/20">
              You are about to delete units from{" "}
              <strong className="text-foreground">{productName}</strong> (Lot{" "}
              <strong className="text-foreground">{lotRef}</strong>).
              <br />
              There are currently{" "}
              <strong className="text-destructive">
                {lot.remainingQuantity}
              </strong>{" "}
              units available in stock.
            </p>
          </div>
          <FormField label="Number of units to delete" htmlFor="quantity">
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              max={lot.remainingQuantity}
              defaultValue={lot.remainingQuantity}
              required
            />
          </FormField>

          <ModalActions
            submitLabel="Confirm Deletion"
            loadingLabel="Processing..."
            isLoading={isSubmitting}
            disabled={lot.remainingQuantity === 0}
            onCancel={() => setIsOpen(false)}
            destructive
          />
        </form>
      </Modal>
    </>
  );
}
