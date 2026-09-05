"use client";

import {
  CurrencyInput,
  DatePickerInput,
  FormField,
  Input,
  Modal,
  ModalActions,
} from "@box-ds";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateSale } from "@/actions/stock/sales";
import { NotesField } from "@/components/ui/NotesField";
import { parseCalendarDay, toCalendarDay } from "@/lib/date";
import { formatCurrency } from "@/lib/formatting";
import {
  optionalDateSchema,
  quantitySchema,
  sellPriceSchema,
} from "@/lib/schemas";
import type { SaleWithProductName } from "@/lib/stock/types";
import type { DatePickerValue } from "@/lib/types";

type SaleItem = SaleWithProductName;

const schema = z.object({
  quantity: quantitySchema,
  sellPrice: sellPriceSchema,
  dateSold: optionalDateSchema,
});

type FormData = z.infer<typeof schema>;

interface EditSaleModalProps {
  sale: SaleItem;
  children: (open: () => void) => React.ReactNode;
}

export function EditSaleModal({ sale, children }: EditSaleModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [notes, setNotes] = React.useState(sale.notes ?? "");
  const router = useRouter();

  const buyPricePerUnit =
    sale.quantitySold > 0
      ? (sale.totalSalePrice - sale.totalProfit) / sale.quantitySold
      : 0;
  const sellPricePerUnit =
    sale.quantitySold > 0 ? sale.totalSalePrice / sale.quantitySold : 0;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: true,
    defaultValues: {
      quantity: sale.quantitySold,
      sellPrice: sellPricePerUnit,
      dateSold: parseCalendarDay(sale.dateSold || sale.createdAt) ?? new Date(),
    },
  });

  const watchedQty = watch("quantity");
  const watchedSell = watch("sellPrice");
  const parsedQty = Math.max(1, Math.floor(Number(watchedQty) || 1));
  const parsedSell = Math.max(0, Number(watchedSell) || 0);
  const previewTotal = Math.round(parsedQty * parsedSell * 100) / 100;
  const previewProfit =
    Math.round((previewTotal - parsedQty * buyPricePerUnit) * 100) / 100;

  const resetForm = () => {
    reset({
      quantity: sale.quantitySold,
      sellPrice: sellPricePerUnit,
      dateSold: parseCalendarDay(sale.dateSold || sale.createdAt) ?? new Date(),
    });
    setNotes(sale.notes ?? "");
  };

  const handleClose = () => {
    resetForm();
    setIsOpen(false);
  };

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    const parsedQtyVal = data.quantity;
    const parsedSellVal = Math.max(0, Math.round(data.sellPrice * 100) / 100);
    try {
      await updateSale(sale.id, {
        quantitySold: parsedQtyVal,
        salePricePerUnit: parsedSellVal,
        dateSold: toCalendarDay(
          data.dateSold ??
            parseCalendarDay(sale.dateSold || sale.createdAt) ??
            new Date(),
        ),
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
  });

  return (
    <>
      {children(() => setIsOpen(true))}
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={`Edit Sale — ${sale.Product?.name ?? "Unknown Product"}`}
      >
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-body-sm text-foreground/80">
            Buy price is{" "}
            <strong className="text-foreground">
              {formatCurrency(buyPricePerUnit)}
            </strong>{" "}
            per unit and is fixed — only quantity and sell price affect profit.
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Quantity Sold"
                htmlFor="es-quantity"
                error={errors.quantity?.message}
              >
                <Input
                  id="es-quantity"
                  type="number"
                  min="1"
                  step="1"
                  error={!!errors.quantity}
                  {...register("quantity", { valueAsNumber: true })}
                />
              </FormField>
              <FormField
                label="Sell Price (per unit)"
                htmlFor="es-sellPrice"
                error={errors.sellPrice?.message}
              >
                <Controller
                  name="sellPrice"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      id="es-sellPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      error={!!errors.sellPrice}
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const n = parseFloat(e.target.value);
                        field.onChange(Number.isNaN(n) ? 0 : n);
                      }}
                    />
                  )}
                />
              </FormField>
            </div>

            <Controller
              name="dateSold"
              control={control}
              render={({ field, fieldState }) => (
                <FormField
                  label="Date Sold"
                  className="flex flex-col"
                  htmlFor="es-dateSold"
                  error={fieldState.error?.message}
                >
                  <DatePickerInput
                    onChange={(val) => field.onChange(val as DatePickerValue)}
                    value={field.value ?? null}
                    error={!!fieldState.error}
                  />
                </FormField>
              )}
            />

            <FormField
              label="Notes"
              htmlFor="es-notes"
              hint="optional, max 75 chars"
            >
              <NotesField id="es-notes" value={notes} onChange={setNotes} />
            </FormField>

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
