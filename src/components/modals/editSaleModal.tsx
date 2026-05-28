"use client";

import {
  CurrencyInput,
  DatePickerInput,
  FormField,
  Input,
  Modal,
  ModalActions,
} from "@box-ds";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { updateSale } from "@/actions/stock/sales";
import { NotesField } from "@/components/ui/NotesField";
import { formatCurrency, parseIntQty } from "@/lib/formatting";
import type { SaleWithProductName } from "@/lib/stock/types";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

type SaleItem = SaleWithProductName;

interface EditSaleModalProps {
  sale: SaleItem;
  children: (open: () => void) => React.ReactNode;
}

export function EditSaleModal({ sale, children }: EditSaleModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const router = useRouter();

  const buyPricePerUnit =
    sale.quantitySold > 0
      ? (sale.totalSalePrice - sale.totalProfit) / sale.quantitySold
      : 0;
  const sellPricePerUnit =
    sale.quantitySold > 0 ? sale.totalSalePrice / sale.quantitySold : 0;

  const [quantity, setQuantity] = React.useState(String(sale.quantitySold));
  const [sellPrice, setSellPrice] = React.useState(sellPricePerUnit.toFixed(2));
  const [dateSold, setDateSold] = React.useState<Value>(
    new Date(sale.dateSold || sale.createdAt),
  );
  const [notes, setNotes] = React.useState(sale.notes ?? "");

  const parsedQty = Math.max(1, Math.floor(parseFloat(quantity) || 1));
  const parsedSell = Math.max(0, parseFloat(sellPrice) || 0);
  const previewTotal = Math.round(parsedQty * parsedSell * 100) / 100;
  const previewProfit =
    Math.round((previewTotal - parsedQty * buyPricePerUnit) * 100) / 100;

  const resetForm = () => {
    setQuantity(String(sale.quantitySold));
    setSellPrice(sellPricePerUnit.toFixed(2));
    setDateSold(new Date(sale.dateSold || sale.createdAt));
    setNotes(sale.notes ?? "");
  };

  const handleClose = () => {
    resetForm();
    setIsOpen(false);
  };

  const handleQuantityBlur = () => {
    setQuantity(String(parseIntQty(quantity, sale.quantitySold)));
  };

  const handleSellPriceBlur = () => {
    const n = parseFloat(sellPrice);
    if (Number.isFinite(n) && n >= 0) {
      setSellPrice((Math.round(n * 100) / 100).toFixed(2));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateSale(sale.id, {
        quantitySold: parsedQty,
        salePricePerUnit: parsedSell,
        dateSold: dateSold as Date,
        notes,
      });
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update sale",
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
        title={`Edit Sale — ${sale.Product?.name ?? "Unknown Product"}`}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-body-sm text-foreground/80">
            Buy price is{" "}
            <strong className="text-foreground">
              {formatCurrency(buyPricePerUnit)}
            </strong>{" "}
            per unit and is fixed — only quantity and sell price affect profit.
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Quantity Sold" htmlFor="es-quantity">
                <Input
                  id="es-quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  onBlur={handleQuantityBlur}
                  required
                />
              </FormField>
              <FormField label="Sell Price (per unit)" htmlFor="es-sellPrice">
                <CurrencyInput
                  id="es-sellPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  onBlur={handleSellPriceBlur}
                  required
                />
              </FormField>
            </div>

            <FormField label="Date Sold" className="flex flex-col">
              <DatePickerInput onChange={setDateSold} value={dateSold} />
            </FormField>

            <FormField
              label="Notes"
              htmlFor="es-notes"
              hint="optional, max 75 chars"
            >
              <NotesField id="es-notes" value={notes} onChange={setNotes} />
            </FormField>

            {/* Live preview */}
            <div className="grid grid-cols-2 gap-3 text-body-sm bg-muted/20 rounded-lg p-3 border border-border/50">
              <div>
                <p className="text-caption text-muted-foreground mb-0.5">
                  Total Sell
                </p>
                <p className="text-body-sm-strong text-primary">
                  {formatCurrency(previewTotal)}
                </p>
              </div>
              <div>
                <p className="text-caption text-muted-foreground mb-0.5">
                  Net Profit
                </p>
                <p
                  className={`text-body-sm-strong ${previewProfit >= 0 ? "text-positive" : "text-destructive"}`}
                >
                  {previewProfit >= 0 ? "+" : ""}
                  {formatCurrency(previewProfit)}
                </p>
              </div>
            </div>
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
