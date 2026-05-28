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
import { addProduct, getRecentProducts } from "@/actions/stock/inventory";
import { NotesField } from "@/components/ui/NotesField";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { parseCurrencyInput, parseIntQty } from "@/lib/formatting";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface AddProductModalProps {
  children?: ((open: () => void) => React.ReactNode) | React.ReactNode;
  trigger?: React.ReactNode;
}

function generateLotIdentity() {
  const now = new Date();
  const date = now.toISOString().split("T")[0].replace(/-/g, "");
  const time = now.toTimeString().slice(0, 8).replace(/:/g, "");
  return `L-${date}-${time}`;
}

export function AddProductModal({ children, trigger }: AddProductModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isStocked, setIsStocked] = React.useState(true);
  const [dateReceived, setDateReceived] = React.useState<Value>(new Date());
  const [quantity, setQuantity] = React.useState<string>("1");
  const [buyPrice, setBuyPrice] = React.useState<string>("");
  const [lotIdentity, setLotIdentity] = React.useState("");
  const [productName, setProductName] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [recentProducts, setRecentProducts] = React.useState<
    { id: string; name: string }[]
  >([]);
  const router = useRouter();

  React.useEffect(() => {
    setLotIdentity(generateLotIdentity());
    getRecentProducts(3)
      .then(setRecentProducts)
      .catch(() => {});
  }, []);

  const handleQuantityBlur = () => {
    setQuantity(String(parseIntQty(quantity)));
  };

  const handleBuyPriceBlur = () => {
    setBuyPrice(parseCurrencyInput(buyPrice));
  };

  const resetForm = () => {
    setProductName("");
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
    const name = formData.get("name") as string;
    const parsedQty = parseIntQty(quantity);
    const parsedPrice = Math.round(parseFloat(buyPrice) * 100) / 100;
    const lotId = formData.get("lotIdentity") as string;

    try {
      await addProduct({
        name,
        initialQuantity: parsedQty,
        buyPrice: parsedPrice,
        isStocked,
        dateAcquired: dateReceived as Date,
        lotIdentity: lotId,
        notes,
      });
      posthog.capture("stock_added", {
        product_name: name,
        initial_quantity: parsedQty,
        buy_price: parsedPrice,
        is_stocked: isStocked,
      });
      resetForm();
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add stock",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {typeof children === "function" ? (
        children(() => setIsOpen(true))
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-block bg-transparent p-0 border-0 text-left"
        >
          {trigger || children}
        </button>
      )}
      <Modal
        isOpen={isOpen}
        onClose={() => {
          resetForm();
          setIsOpen(false);
        }}
        title="Add Stock"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="space-y-5">
            {/* Product Name */}
            <FormField label="Product Name" htmlFor="name">
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Product Name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
              {recentProducts.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                  <span className="text-caption text-muted-foreground/50 shrink-0 uppercase tracking-wide">
                    Suggested:
                  </span>
                  {recentProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProductName(p.name)}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-caption bg-primary/10 text-primary/80 border border-primary/20 hover:bg-primary/20 hover:text-primary hover:border-primary/40 transition-all"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Quantity */}
              <FormField label="Initial Lot Quantity" htmlFor="quantity">
                <Input
                  id="quantity"
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
              {/* Unit Price */}
              <FormField label="Unit Buy Price" htmlFor="buyPrice">
                <CurrencyInput
                  id="buyPrice"
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
              {/* Date Received */}
              <FormField label="Date Received" className="flex flex-col">
                <div className="w-full flex">
                  <DatePickerInput
                    onChange={setDateReceived}
                    value={dateReceived}
                  />
                </div>
              </FormField>

              {/* Lot Identity */}
              <FormField label="Lot Identity" htmlFor="lotIdentity">
                <Input
                  id="lotIdentity"
                  name="lotIdentity"
                  value={lotIdentity}
                  onChange={(e) => setLotIdentity(e.target.value)}
                  placeholder="e.g. L-20260430-143052"
                />
              </FormField>
            </div>

            {/* Status Toggle */}
            <div className="space-y-2">
              <Label>Status</Label>
              <StatusToggle value={isStocked} onChange={setIsStocked} />
            </div>

            {/* Notes */}
            <FormField
              label="Notes"
              htmlFor="notes"
              hint="optional, max 75 chars"
            >
              <NotesField id="notes" value={notes} onChange={setNotes} />
            </FormField>
          </div>

          <ModalActions
            submitLabel="Add to Inventory"
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
