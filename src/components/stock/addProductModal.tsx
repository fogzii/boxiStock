"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addProduct } from "@/actions/stock";
import { useRouter } from "next/navigation";

interface AddProductModalProps {
  children: (open: () => void) => React.ReactNode;
}

export function AddProductModal({ children }: AddProductModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const initialQuantity = parseInt(
      formData.get("initialQuantity") as string,
      10,
    );
    const buyPrice = parseFloat(formData.get("buyPrice") as string);
    const dateAcquiredStr = formData.get("date") as string;
    const lotIdentity = formData.get("lotIdentity") as string;

    const dateAcquired = dateAcquiredStr ? new Date(dateAcquiredStr) : new Date();

    try {
      await addProduct({ name, initialQuantity, buyPrice, isStocked: false, dateAcquired, lotIdentity });
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to add product:", error);
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
        title="Add New Product"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Mechanical Keyboard"
              required
              className="bg-background border-border/50"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="space-y-2 flex-1">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={new Date().toLocaleDateString("en-CA")} // gets YYYY-MM-DD
                required
                className="bg-background border-border/50"
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="lotIdentity">Lot Identity</Label>
              <Input
                id="lotIdentity"
                name="lotIdentity"
                defaultValue={`L-${new Date().toLocaleDateString("en-CA").replace(/-/g, "")}-1`}
                placeholder="e.g. L-20260328-1"
                className="bg-background border-border/50"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="space-y-2 flex-1">
              <Label htmlFor="initialQuantity">Initial Quantity</Label>
              <Input
                id="initialQuantity"
                name="initialQuantity"
                type="number"
                min="1"
                placeholder="10"
                required
                className="bg-background border-border/50"
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="buyPrice">Buy Price (per unit)</Label>
              <Input
                id="buyPrice"
                name="buyPrice"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="25.00"
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
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
            >
              {isSubmitting ? "Adding..." : "Add Product"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

