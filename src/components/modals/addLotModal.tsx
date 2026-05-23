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
import posthog from "posthog-js";
import * as React from "react";
import { toast } from "sonner";
import { addStockLot } from "@/actions/stock";
import { NotesField } from "@/components/ui/NotesField";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { parseCurrencyInput, parseIntQty } from "@/lib/formatting";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

function generateLotIdentity() {
  const now = new Date();
  const date = now.toISOString().split("T")[0].replace(/-/g, "");
  const time = now.toTimeString().slice(0, 8).replace(/:/g, "");
  return `L-${date}-${time}`;
}

interface AddLotModalProps {
  productId: string;
  productName: string;
  children: (open: () => void) => React.ReactNode;
}

export function AddLotModal({
  productId,
  productName,
  children,
}: AddLotModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isStocked, setIsStocked] = React.useState(true);
  const [dateReceived, setDateReceived] = React.useState<Value>(new Date());
  const [quantity, setQuantity] = React.useState<string>("1");
  const [buyPrice, setBuyPrice] = React.useState<string>("");
  const [lotIdentity, setLotIdentity] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const router = useRouter();

  React.useEffect(() => {
    setLotIdentity(generateLotIdentity());
  }, []);

  const handleQuantityBlur = () => {
    setQuantity(String(parseIntQty(quantity)));
  };

  const handleBuyPriceBlur = () => {
    setBuyPrice(parseCurrencyInput(buyPrice));
  };

  const resetForm = () => {
    setQuantity("1");
    setBuyPrice("");
    setIsStocked(true);
    setDateReceived(new Date());
    setLotIdentity(generateLotIdentity());
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const parsedQty = parseIntQty(quantity);
    const parsedPrice = Math.round(parseFloat(buyPrice) * 100) / 100;
    const lotId = formData.get("lotIdentity") as string;

    try {
      await addStockLot({
        productId,
        initialQuantity: parsedQty,
        buyPrice: parsedPrice,
        isStocked,
        dateAcquired: dateReceived as Date,
        lotIdentity: lotId,
        notes,
      });
      posthog.capture("stock_lot_added", {
        product_name: productName,
        initial_quantity: parsedQty,
        buy_price: parsedPrice,
        is_stocked: isStocked,
      });
      resetForm();
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add lot");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {children(() => setIsOpen(true))}
      <Modal
        isOpen={isOpen}
        onClose={() => {
          resetForm();
          setIsOpen(false);
        }}
        title={`Add Stock — ${productName}`}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Lot Quantity" htmlFor="lot-quantity">
                <Input
                  id="lot-quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  onBlur={handleQuantityBlur}
                  required
                />
              </FormField>
              <FormField label="Unit Buy Price" htmlFor="lot-buyPrice">
                <CurrencyInput
                  id="lot-buyPrice"
                  name="buyPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  onBlur={handleBuyPriceBlur}
                  required
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Date Received" className="flex flex-col">
                <div className="w-full flex">
                  <DatePickerInput
                    onChange={setDateReceived}
                    value={dateReceived}
                  />
                </div>
              </FormField>

              <FormField label="Lot Identity" htmlFor="lot-lotIdentity">
                <Input
                  id="lot-lotIdentity"
                  name="lotIdentity"
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
              htmlFor="lot-notes"
              hint="optional, max 75 chars"
            >
              <NotesField id="lot-notes" value={notes} onChange={setNotes} />
            </FormField>
          </div>

          <ModalActions
            submitLabel="Add Lot"
            loadingLabel="Adding..."
            isLoading={isSubmitting}
            onCancel={() => {
              resetForm();
              setIsOpen(false);
            }}
          />
        </form>
      </Modal>
    </>
  );
}
