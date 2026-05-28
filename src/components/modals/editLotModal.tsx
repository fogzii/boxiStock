"use client";

import {
  CurrencyInput,
  DatePickerInput,
  FormField,
  Input,
  Label,
  Modal,
  ModalActions,
} from "@box-ds";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { updateLot } from "@/actions/stock/inventory";
import type { StockLot } from "@/components/stock/lotCard";
import { NotesField } from "@/components/ui/NotesField";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { parseCurrencyInput, parseIntQty } from "@/lib/formatting";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

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
    setQuantity(String(parseIntQty(quantity, lot.remainingQuantity)));
  };

  const handleBuyPriceBlur = () => {
    setBuyPrice(parseCurrencyInput(buyPrice));
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
      toast.error(
        error instanceof Error ? error.message : "Failed to update lot",
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
        onClose={handleClose}
        title={`Edit Lot — ${productName}`}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <p className="text-body-sm text-foreground/80 bg-primary/10 p-3 rounded-lg border border-primary/20">
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
              <FormField label="Remaining Quantity" htmlFor="edit-quantity">
                <Input
                  id="edit-quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  onBlur={handleQuantityBlur}
                  required
                />
              </FormField>
              <FormField label="Unit Buy Price" htmlFor="edit-buyPrice">
                <CurrencyInput
                  id="edit-buyPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  onBlur={handleBuyPriceBlur}
                  required
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Date Acquired" className="flex flex-col">
                <div className="w-full flex">
                  <DatePickerInput
                    onChange={setDateAcquired}
                    value={dateAcquired}
                  />
                </div>
              </FormField>

              <FormField label="Lot Identity" htmlFor="edit-lotIdentity">
                <Input
                  id="edit-lotIdentity"
                  value={lotIdentity}
                  onChange={(e) => setLotIdentity(e.target.value)}
                  placeholder="e.g. L-20260430-143052"
                />
              </FormField>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <StatusToggle value={isStocked} onChange={setIsStocked} />
            </div>

            <FormField
              label="Notes"
              htmlFor="edit-notes"
              hint="optional, max 75 chars"
            >
              <NotesField id="edit-notes" value={notes} onChange={setNotes} />
            </FormField>
          </div>

          <ModalActions
            submitLabel="Save Changes"
            loadingLabel="Saving..."
            isLoading={isSubmitting}
            onCancel={handleClose}
          />
        </form>
      </Modal>
    </>
  );
}
