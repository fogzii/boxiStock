"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteLotUnits } from "@/actions/stock";
import { useRouter } from "next/navigation";
import { StockLot } from "./lotCard";

interface DeleteUnitsModalProps {
  children: (open: () => void) => React.ReactNode;
  lot: StockLot;
  productName: string;
}

export function DeleteUnitsModal({ children, lot, productName }: DeleteUnitsModalProps) {
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
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete units:", error);
      alert(error instanceof Error ? error.message : "Failed to delete units");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {children(() => setIsOpen(true))}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Delete Units">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
             <p className="text-sm text-foreground/80 leading-relaxed bg-destructive/10 p-3 rounded-lg border border-destructive/20">
               You are about to delete units from <strong className="text-foreground">{productName}</strong> (Lot <strong className="text-foreground">{lotRef}</strong>).
               <br />
               There are currently <strong className="text-destructive">{lot.remainingQuantity}</strong> units available in stock.
             </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Number of units to delete</Label>
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
          
          <div className="flex justify-end gap-3 mt-2">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || lot.remainingQuantity === 0}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold cursor-pointer"
            >
              {isSubmitting ? "Processing..." : "Confirm Deletion"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
