"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addProduct } from "@/actions/stock";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import DatePicker from 'react-date-picker';
import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface AddProductModalProps {
  children?: ((open: () => void) => React.ReactNode) | React.ReactNode;
  trigger?: React.ReactNode;
}

export function AddProductModal({ children, trigger }: AddProductModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isStocked, setIsStocked] = React.useState(true);
  const [dateReceived, setDateReceived] = React.useState<Value>(new Date());
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // ... logic remains same ...
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const quantity = parseInt(formData.get("quantity") as string, 10);
    const buyPrice = parseFloat(formData.get("buyPrice") as string);
    const lotIdentity = formData.get("lotIdentity") as string;

    try {
      await addProduct({
        name,
        initialQuantity: quantity,
        buyPrice,
        isStocked,
        dateAcquired: dateReceived as Date,
        lotIdentity
      });
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to add stock:", error);
      alert(error instanceof Error ? error.message : "Failed to add stock");
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <>
      {typeof children === "function" ? (
        children(() => setIsOpen(true))
      ) : (
        <div onClick={() => setIsOpen(true)} className="inline-block cursor-pointer">
          {trigger || children}
        </div>
      )}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add Stock">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="space-y-5">
            {/* Product Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-muted-foreground">Product Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="e.g. Wireless Mouse G502"
                required
                className="bg-background/50 border-primary/20 h-11"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-muted-foreground">Initial Lot Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  placeholder="0"
                  required
                  className="bg-background/50 border-primary/20 h-11"
                />
              </div>
              {/* Unit Price */}
              <div className="space-y-2">
                <Label htmlFor="buyPrice" className="text-muted-foreground">Unit Buy Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="buyPrice"
                    name="buyPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
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
                <Label htmlFor="lotIdentity" className="text-muted-foreground">Lot Identity</Label>
                <Input
                  id="lotIdentity"
                  name="lotIdentity"
                  defaultValue={`L-${todayStr.replace(/-/g, "")}-1`}
                  placeholder="e.g. L-20260328-1"
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
                      : "text-muted-foreground hover:text-foreground"
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
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Pending
                </button>
              </div>
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
