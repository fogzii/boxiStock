"use client";

import { Button, CurrencyInput, FormField, Input, Modal } from "@box-ds";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { updateBundle } from "@/actions/stock/bundles";
import { formatCurrency, round2 } from "@/lib/formatting";

interface EditBundleModalProps {
  children: (open: () => void) => React.ReactNode;
  bundle: {
    bundleId: string;
    bundleName: string;
    totalSellPrice: number;
    totalBuyCost: number;
    dateSold: string | null;
  };
}

export function EditBundleModal({ children, bundle }: EditBundleModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const router = useRouter();

  const [name, setName] = React.useState(bundle.bundleName);
  const [sellPriceStr, setSellPriceStr] = React.useState(
    bundle.totalSellPrice.toFixed(2),
  );
  const [dateSoldStr, setDateSoldStr] = React.useState(
    bundle.dateSold ? new Date(bundle.dateSold).toISOString().slice(0, 10) : "",
  );

  function handleOpen() {
    setName(bundle.bundleName);
    setSellPriceStr(bundle.totalSellPrice.toFixed(2));
    setDateSoldStr(
      bundle.dateSold
        ? new Date(bundle.dateSold).toISOString().slice(0, 10)
        : "",
    );
    setIsOpen(true);
  }

  const sellPrice = parseFloat(sellPriceStr) || 0;
  const previewProfit = round2(sellPrice - bundle.totalBuyCost);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || sellPriceStr === "") return;
    setIsSubmitting(true);
    try {
      await updateBundle(bundle.bundleId, {
        name: name.trim(),
        totalSellPrice: round2(sellPrice),
        dateSold: dateSoldStr ? new Date(dateSoldStr) : undefined,
      });
      toast.success("Bundle updated.");
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update bundle.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {children(handleOpen)}
      <Modal
        isOpen={isOpen}
        onClose={() => !isSubmitting && setIsOpen(false)}
        title="Edit Bundle"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <FormField label="Bundle Name" htmlFor="edit-bundle-name">
            <Input
              id="edit-bundle-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Sell Price" htmlFor="edit-sell-price">
            <CurrencyInput
              id="edit-sell-price"
              type="number"
              min="0"
              step="0.01"
              value={sellPriceStr}
              onChange={(e) => setSellPriceStr(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Date sold" htmlFor="edit-date-sold" hint="optional">
            <Input
              id="edit-date-sold"
              type="date"
              value={dateSoldStr}
              onChange={(e) => setDateSoldStr(e.target.value)}
            />
          </FormField>

          {/* Profit preview */}
          <div className="flex items-center justify-between rounded-lg bg-muted/20 border border-border/40 px-4 py-3">
            <div className="text-body-sm text-muted-foreground">
              <div>Buy cost: {formatCurrency(bundle.totalBuyCost)}</div>
            </div>
            <div className="text-right">
              <div className="text-caption text-muted-foreground mb-0.5">
                Net profit
              </div>
              <div
                className={`text-body-lg ${previewProfit >= 0 ? "text-positive" : "text-destructive"}`}
              >
                {previewProfit >= 0 ? "+" : ""}
                {formatCurrency(previewProfit)}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim() || sellPriceStr === ""}
              className="text-button-md"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
