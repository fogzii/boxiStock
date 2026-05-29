"use client";

import {
  Button,
  CurrencyInput,
  DatePickerInput,
  FormField,
  Input,
  Modal,
} from "@box-ds";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateBundle } from "@/actions/stock/bundles";
import { formatCurrency, round2 } from "@/lib/formatting";
import { optionalDateSchema, sellPriceSchema } from "@/lib/schemas";
import type { DatePickerValue } from "@/lib/types";

const schema = z.object({
  name: z.string().min(1, "Bundle name is required"),
  sellPrice: sellPriceSchema,
  dateSold: optionalDateSchema,
});

type FormData = z.infer<typeof schema>;

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
      name: bundle.bundleName,
      sellPrice: bundle.totalSellPrice,
      dateSold: bundle.dateSold ? new Date(bundle.dateSold) : undefined,
    },
  });

  function handleOpen() {
    reset({
      name: bundle.bundleName,
      sellPrice: bundle.totalSellPrice,
      dateSold: bundle.dateSold ? new Date(bundle.dateSold) : undefined,
    });
    setIsOpen(true);
  }

  const watchedSell = watch("sellPrice");
  const sellPrice = Number(watchedSell) || 0;
  const previewProfit = round2(sellPrice - bundle.totalBuyCost);

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      await updateBundle(bundle.bundleId, {
        name: data.name.trim(),
        totalSellPrice: round2(Number(data.sellPrice) || 0),
        dateSold: data.dateSold,
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
  });

  return (
    <>
      {children(handleOpen)}
      <Modal
        isOpen={isOpen}
        onClose={() => {
          if (!isSubmitting) {
            reset();
            setIsOpen(false);
          }
        }}
        title="Edit Bundle"
      >
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          <FormField
            label="Bundle Name"
            htmlFor="edit-bundle-name"
            error={undefined}
          >
            <Input
              id="edit-bundle-name"
              error={!!errors.name}
              {...register("name")}
            />
          </FormField>

          <FormField
            label="Sell Price"
            htmlFor="edit-sell-price"
            error={errors.sellPrice?.message}
          >
            <Controller
              name="sellPrice"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  id="edit-sell-price"
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

          <Controller
            name="dateSold"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Date sold"
                className="flex flex-col"
                hint="optional"
                error={fieldState.error?.message}
              >
                <div className="w-full flex">
                  <DatePickerInput
                    onChange={(val) =>
                      field.onChange((val as DatePickerValue) ?? undefined)
                    }
                    value={field.value ?? null}
                    error={!!fieldState.error}
                  />
                </div>
              </FormField>
            )}
          />

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
              onClick={() => {
                if (!isSubmitting) {
                  reset();
                  setIsOpen(false);
                }
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
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
