"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { updateBundle } from "@/actions/stock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";

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

function round2(n: number) {
  return Math.round(n * 100) / 100;
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

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

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
          <div className="space-y-2">
            <Label htmlFor="edit-bundle-name">Bundle Name</Label>
            <Input
              id="edit-bundle-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background border-border/50"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-sell-price">Sell Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="edit-sell-price"
                type="number"
                min="0"
                step="0.01"
                value={sellPriceStr}
                onChange={(e) => setSellPriceStr(e.target.value)}
                className="pl-7 bg-background border-border/50"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-date-sold">
              Date sold{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="edit-date-sold"
              type="date"
              value={dateSoldStr}
              onChange={(e) => setDateSoldStr(e.target.value)}
              className="bg-background border-border/50"
            />
          </div>

          {/* Profit preview */}
          <div className="flex items-center justify-between rounded-lg bg-muted/20 border border-border/40 px-4 py-3">
            <div className="text-sm text-muted-foreground">
              <div>Buy cost: {formatter.format(bundle.totalBuyCost)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground mb-0.5">
                Net profit
              </div>
              <div
                className={`text-lg font-bold ${previewProfit >= 0 ? "text-emerald-400" : "text-destructive"}`}
              >
                {previewProfit >= 0 ? "+" : ""}
                {formatter.format(previewProfit)}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim() || sellPriceStr === ""}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold cursor-pointer"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
