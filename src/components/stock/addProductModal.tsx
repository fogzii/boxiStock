"use client";

import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import * as React from "react";
import DatePicker from "react-date-picker";
import { addProduct, getRecentProducts } from "@/actions/stock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

const MAX_NOTES_LENGTH = 50;

function NotesInput() {
  const [value, setValue] = React.useState("");
  return (
    <div className="relative">
      <Input
        id="notes"
        name="notes"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, MAX_NOTES_LENGTH))}
        maxLength={MAX_NOTES_LENGTH}
        placeholder="Add notes..."
        className="bg-background/50 border-primary/20 h-11 pr-14"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground/40 tabular-nums pointer-events-none">
        {value.length}/{MAX_NOTES_LENGTH}
      </span>
    </div>
  );
}

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
    const n = Math.floor(parseFloat(quantity));
    setQuantity(String(Number.isFinite(n) && n >= 1 ? n : 1));
  };

  const handleBuyPriceBlur = () => {
    const n = parseFloat(buyPrice);
    if (Number.isFinite(n)) {
      setBuyPrice((Math.round(n * 100) / 100).toFixed(2));
    }
  };

  const resetForm = () => {
    setProductName("");
    setQuantity("1");
    setBuyPrice("");
    setIsStocked(true);
    setDateReceived(new Date());
    setLotIdentity(generateLotIdentity());
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const parsedQty = Math.floor(parseFloat(quantity));
    const parsedPrice = Math.round(parseFloat(buyPrice) * 100) / 100;
    const lotIdentity = formData.get("lotIdentity") as string;
    const notes = formData.get("notes") as string;

    try {
      await addProduct({
        name,
        initialQuantity: parsedQty,
        buyPrice: parsedPrice,
        isStocked,
        dateAcquired: dateReceived as Date,
        lotIdentity,
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
      console.error("Failed to add stock:", error);
      alert(error instanceof Error ? error.message : "Failed to add stock");
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
          className="inline-block cursor-pointer bg-transparent p-0 border-0 text-left"
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
            <div className="space-y-2">
              <Label htmlFor="name" className="text-muted-foreground">
                Product Name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Product Name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
                className="bg-background/50 border-primary/20 h-11"
              />
              {recentProducts.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                  <span className="text-[11px] text-muted-foreground/50 shrink-0 font-medium uppercase tracking-wide">
                    Suggested:
                  </span>
                  {recentProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProductName(p.name)}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary/80 border border-primary/20 hover:bg-primary/20 hover:text-primary hover:border-primary/40 transition-all cursor-pointer"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-muted-foreground">
                  Initial Lot Quantity
                </Label>
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
                  className="bg-background/50 border-primary/20 h-11"
                />
              </div>
              {/* Unit Price */}
              <div className="space-y-2">
                <Label htmlFor="buyPrice" className="text-muted-foreground">
                  Unit Buy Price
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
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
                    className="pl-7 bg-background/50 border-primary/20 h-11"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date Received */}
              <div className="space-y-2 flex flex-col">
                <Label className="text-muted-foreground">Date Received</Label>
                <div className="w-full flex">
                  <DatePicker
                    onChange={setDateReceived}
                    value={dateReceived}
                    className="w-full bg-background/50 dark:bg-input/30 border border-primary/20 h-11 rounded-md [color-scheme:dark] flex items-center text-sm"
                    clearIcon={null}
                  />
                </div>
              </div>

              {/* Lot Identity */}
              <div className="space-y-2">
                <Label htmlFor="lotIdentity" className="text-muted-foreground">
                  Lot Identity
                </Label>
                <Input
                  id="lotIdentity"
                  name="lotIdentity"
                  value={lotIdentity}
                  onChange={(e) => setLotIdentity(e.target.value)}
                  placeholder="e.g. L-20260430-143052"
                  className="bg-background/50 border-primary/20 h-11"
                />
              </div>
            </div>

            {/* Status Toggle */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Status</Label>
              <div className="flex p-1 bg-background/50 border border-primary/20 rounded-lg">
                <button
                  type="button"
                  onClick={() => setIsStocked(true)}
                  className={cn(
                    "flex-1 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer",
                    isStocked
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  In Hand
                </button>
                <button
                  type="button"
                  onClick={() => setIsStocked(false)}
                  className={cn(
                    "flex-1 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer",
                    !isStocked
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Pending
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-muted-foreground">
                Notes{" "}
                <span className="text-muted-foreground/50 font-normal">
                  (optional, max 50 chars)
                </span>
              </Label>
              <NotesInput />
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 cursor-pointer text-sm rounded-lg"
            >
              {isSubmitting ? "Adding..." : "Add to Inventory"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                resetForm();
                setIsOpen(false);
              }}
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
