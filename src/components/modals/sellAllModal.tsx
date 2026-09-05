"use client";

import {
  Button,
  CurrencyInput,
  DatePickerInput,
  FormField,
  Modal,
} from "@box-ds";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { sellAllLots } from "@/actions/stock/inventory";
import type { ProductWithLots } from "@/components/stock/stockTable";
import { saleToastIcon } from "@/components/ui/toaster";
import { toCalendarDay } from "@/lib/date";
import { formatCurrency, round2 } from "@/lib/formatting";
import { optionalDateSchema, sellPriceSchema } from "@/lib/schemas";
import type { DatePickerValue } from "@/lib/types";

const schema = z.object({
  sellPrice: sellPriceSchema,
  dateSold: optionalDateSchema,
});

type FormData = z.infer<typeof schema>;

interface SellAllModalProps {
  product: ProductWithLots;
  children: (open: () => void) => React.ReactNode;
}

export function SellAllModal({ product, children }: SellAllModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const router = useRouter();

  const totalQty = product.lots.reduce((s, l) => s + l.remainingQuantity, 0);
  const totalBuyCost = round2(
    product.lots.reduce((s, l) => s + l.remainingQuantity * l.buyPrice, 0),
  );

  const {
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
      sellPrice: undefined,
      dateSold: new Date(),
    },
  });

  const watchedSell = watch("sellPrice");
  const sellPrice = Number(watchedSell) || 0;
  const totalProfit = round2(sellPrice - totalBuyCost);

  function handleOpen() {
    reset({ sellPrice: undefined, dateSold: new Date() });
    setIsOpen(true);
  }

  function handleClose() {
    reset({ sellPrice: undefined, dateSold: new Date() });
    setIsOpen(false);
  }

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      await sellAllLots(
        product.id,
        round2(Number(data.sellPrice) || 0),
        toCalendarDay(
          data.dateSold instanceof Date ? data.dateSold : new Date(),
        ),
      );
      toast.success(`Sold all ${totalQty} units of "${product.name}".`, {
        icon: saleToastIcon,
      });
      handleClose();
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to record sale.",
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <>
      {children(handleOpen)}
      <Modal isOpen={isOpen} onClose={handleClose} title="Sell All Stock">
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
          <div className="space-y-5">
            <div className="rounded-lg border border-primary/20 bg-background/50 divide-y divide-primary/10">
              <div className="flex items-center justify-between px-4 h-11">
                <span className="text-body-sm text-muted-foreground">
                  Product
                </span>
                <span className="text-body-sm-strong text-foreground">
                  {product.name}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 h-11">
                <span className="text-body-sm text-muted-foreground">
                  Total qty
                </span>
                <span className="text-body-sm-strong text-foreground">
                  {totalQty} units
                </span>
              </div>
              <div className="flex items-center justify-between px-4 h-11">
                <span className="text-body-sm text-muted-foreground">
                  Total buy cost
                </span>
                <span className="text-body-sm-strong text-foreground">
                  {formatCurrency(totalBuyCost)}
                </span>
              </div>
            </div>

            <FormField
              label="Sell Price"
              htmlFor="sell-all-price"
              error={errors.sellPrice?.message}
            >
              <Controller
                name="sellPrice"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    id="sell-all-price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    error={!!errors.sellPrice}
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                        const n = parseFloat(val);
                        field.onChange(Number.isNaN(n) ? undefined : n);
                      }
                    }}
                    onBlur={() => {
                      if (
                        typeof field.value === "number" &&
                        Number.isFinite(field.value)
                      ) {
                        field.onChange(round2(field.value));
                      }
                    }}
                  />
                )}
              />
            </FormField>

            {typeof watchedSell === "number" && (
              <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-background/50 px-4 h-11">
                <span className="text-body-sm text-muted-foreground">
                  Net profit
                </span>
                <span
                  className={`text-body-sm-strong ${totalProfit >= 0 ? "text-positive" : "text-destructive"}`}
                >
                  {totalProfit >= 0 ? "+" : ""}
                  {formatCurrency(totalProfit)}
                </span>
              </div>
            )}

            <Controller
              name="dateSold"
              control={control}
              render={({ field }) => (
                <FormField label="Date Sold">
                  <div className="w-full flex">
                    <DatePickerInput
                      onChange={(val) => field.onChange(val as DatePickerValue)}
                      value={field.value ?? null}
                    />
                  </div>
                </FormField>
              )}
            />
          </div>

          <div className="flex flex-col sm:flex-row-reverse gap-3 mt-4">
            <Button
              type="submit"
              disabled={totalQty === 0 || isSubmitting}
              className="w-full sm:w-auto h-12 shadow-glow-subtle sm:px-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  Sell All {totalQty} Units
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto h-12 hover:bg-primary/5"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
