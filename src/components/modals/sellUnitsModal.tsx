"use client";

import {
  DatePickerInput,
  FormField,
  Input,
  Modal,
  ModalActions,
} from "@box-ds";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { sellLotUnits } from "@/actions/stock/inventory";
import { round2 } from "@/lib/formatting";
import type { DatePickerValue } from "@/lib/types";

interface SellUnitsModalProps {
  children: (open: () => void) => React.ReactNode;
  lot: {
    id: string;
    remainingQuantity: number;
    buyPrice: number;
    lotIdentity?: string | null;
  };
  productName: string;
}

export function SellUnitsModal({
  children,
  lot,
  productName,
}: SellUnitsModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const router = useRouter();

  const lotRef = lot.lotIdentity || lot.id.slice(-6).toUpperCase();

  const schema = React.useMemo(
    () =>
      z.object({
        quantity: z
          .number({ error: "Enter a valid number" })
          .int("Must be a whole number")
          .positive("Must be at least 1")
          .max(
            lot.remainingQuantity,
            `Cannot exceed ${lot.remainingQuantity} units`,
          ),
        dateSold: z.date({ error: "Date is required" }),
        perUnit: z
          .number({ error: "Enter a valid number" })
          .nonnegative("Cannot be negative")
          .max(1_000_000_000, "Exceeds maximum"),
        total: z
          .number({ error: "Enter a valid number" })
          .nonnegative("Cannot be negative")
          .max(1_000_000_000, "Exceeds maximum"),
      }),
    [lot.remainingQuantity],
  );

  type FormData = z.infer<typeof schema>;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    clearErrors,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: true,
    defaultValues: {
      quantity: lot.remainingQuantity,
      dateSold: new Date(),
      perUnit: lot.buyPrice,
      total: round2(lot.remainingQuantity * lot.buyPrice),
    },
  });

  const watchedQty = watch("quantity");
  const watchedPerUnit = watch("perUnit");

  function resetForm() {
    reset({
      quantity: lot.remainingQuantity,
      dateSold: new Date(),
      perUnit: lot.buyPrice,
      total: round2(lot.remainingQuantity * lot.buyPrice),
    });
  }

  function handleOpen() {
    resetForm();
    setIsOpen(true);
  }

  function handleQuantityChange(e: React.ChangeEvent<HTMLInputElement>) {
    const qty = parseInt(e.target.value, 10);
    const per = Number(watchedPerUnit) || 0;
    if (!Number.isNaN(qty) && qty > 0 && per > 0) {
      setValue("total", round2(qty * per));
    }
  }

  function handlePerUnitChange(e: React.ChangeEvent<HTMLInputElement>) {
    const per = parseFloat(e.target.value);
    const qty = Number(watchedQty) || 0;
    if (!Number.isNaN(per) && qty > 0) {
      setValue("total", round2(qty * per));
      clearErrors("total");
    }
  }

  function handlePerUnitBlur(e: React.FocusEvent<HTMLInputElement>) {
    const per = parseFloat(e.target.value);
    if (!Number.isNaN(per)) {
      const rounded = round2(per);
      setValue("perUnit", rounded);
      const qty = Number(watchedQty) || 0;
      if (qty > 0) setValue("total", round2(qty * rounded));
    }
  }

  function handleTotalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const tot = parseFloat(e.target.value);
    const qty = Number(watchedQty) || 0;
    if (!Number.isNaN(tot) && qty > 0) {
      setValue("perUnit", round2(tot / qty));
      clearErrors("perUnit");
    }
  }

  function handleTotalBlur(e: React.FocusEvent<HTMLInputElement>) {
    const tot = parseFloat(e.target.value);
    if (!Number.isNaN(tot)) {
      const rounded = round2(tot);
      setValue("total", rounded);
      const qty = Number(watchedQty) || 0;
      if (qty > 0) setValue("perUnit", round2(rounded / qty));
    }
  }

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    const salePrice = Math.round(data.perUnit * 100) / 100;
    try {
      await sellLotUnits(lot.id, data.quantity, salePrice, data.dateSold);
      posthog.capture("units_sold", {
        product_name: productName,
        quantity_sold: data.quantity,
        sale_price_per_unit: salePrice,
        total_sale_price: round2(data.quantity * salePrice),
      });
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to sell units",
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <>
      {children(handleOpen)}
      <Modal
        isOpen={isOpen}
        onClose={() => {
          reset();
          setIsOpen(false);
        }}
        title="Sell Units"
      >
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
          <div>
            <p className="text-body-sm text-foreground/80 bg-primary/10 p-3 rounded-lg border border-primary/20">
              You are selling units from{" "}
              <strong className="text-foreground">{productName}</strong> (Lot{" "}
              <strong className="text-foreground">{lotRef}</strong>).
              <br />
              There are currently{" "}
              <strong className="text-primary">{lot.remainingQuantity}</strong>{" "}
              units available in stock.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Quantity to Sell"
              htmlFor="quantity"
              className="min-w-0"
              error={errors.quantity?.message}
            >
              <Input
                id="quantity"
                type="number"
                min="1"
                max={lot.remainingQuantity}
                error={!!errors.quantity}
                {...register("quantity", {
                  valueAsNumber: true,
                  onChange: handleQuantityChange,
                })}
              />
            </FormField>
            <Controller
              name="dateSold"
              control={control}
              render={({ field, fieldState }) => (
                <FormField
                  label="Date Sold"
                  className="min-w-0"
                  error={fieldState.error?.message}
                >
                  <DatePickerInput
                    onChange={(val) => field.onChange(val as DatePickerValue)}
                    value={field.value}
                    error={!!fieldState.error}
                  />
                </FormField>
              )}
            />
          </div>

          <div className="space-y-3">
            <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Sell Price (per unit)"
                htmlFor="perUnit"
                className="min-w-0"
                error={errors.perUnit?.message}
              >
                <Input
                  id="perUnit"
                  type="number"
                  min="0"
                  step="0.01"
                  error={!!errors.perUnit}
                  {...register("perUnit", {
                    valueAsNumber: true,
                    onChange: handlePerUnitChange,
                    onBlur: handlePerUnitBlur,
                  })}
                />
              </FormField>
              <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 top-[calc(50%+0.875rem)] hidden rounded-full bg-canvas px-1.5 text-body-sm-strong text-foreground/40 select-none sm:block">
                or
              </div>
              <FormField
                label="Sell Price (total)"
                htmlFor="total"
                className="min-w-0"
                error={errors.total?.message}
              >
                <Input
                  id="total"
                  type="number"
                  min="0"
                  step="0.01"
                  error={!!errors.total}
                  {...register("total", {
                    valueAsNumber: true,
                    onChange: handleTotalChange,
                    onBlur: handleTotalBlur,
                  })}
                />
              </FormField>
            </div>
            <p className="text-caption text-foreground/50">
              Edit either price — changing one will update the other.
            </p>
          </div>

          <ModalActions
            submitLabel="Confirm Sale"
            loadingLabel="Processing..."
            isLoading={isSubmitting}
            disabled={lot.remainingQuantity === 0}
            onCancel={() => {
              reset();
              setIsOpen(false);
            }}
          />
        </form>
      </Modal>
    </>
  );
}
