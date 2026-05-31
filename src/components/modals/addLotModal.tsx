"use client";

import {
  CurrencyInput,
  DatePickerInput,
  FormField,
  Input,
  Label,
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
import { addStockLot } from "@/actions/stock/inventory";
import { NotesField } from "@/components/ui/NotesField";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { generateLotIdentity } from "@/lib/formatting";
import {
  buyPriceSchema,
  lotIdentitySchema,
  optionalDateSchema,
  quantitySchema,
} from "@/lib/schemas";

const schema = z.object({
  quantity: quantitySchema,
  buyPrice: buyPriceSchema,
  dateReceived: optionalDateSchema,
  lotIdentity: lotIdentitySchema,
});

type FormData = z.infer<typeof schema>;

interface AddLotModalProps {
  productId: string;
  productName: string;
  children: (open: () => void) => React.ReactNode;
}

export function AddLotModal({
  productId,
  productName,
  children,
}: AddLotModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isStocked, setIsStocked] = React.useState(true);
  const [notes, setNotes] = React.useState("");
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: true,
    defaultValues: {
      quantity: 1,
      buyPrice: undefined,
      dateReceived: new Date(),
      lotIdentity: generateLotIdentity(),
    },
  });

  const resetForm = () => {
    reset({
      quantity: 1,
      buyPrice: undefined,
      dateReceived: new Date(),
      lotIdentity: generateLotIdentity(),
    });
    setIsStocked(true);
    setNotes("");
  };

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      await addStockLot({
        productId,
        initialQuantity: data.quantity,
        buyPrice: Math.round(data.buyPrice * 100) / 100,
        isStocked,
        dateAcquired: data.dateReceived ?? new Date(),
        lotIdentity: data.lotIdentity ?? "",
        notes,
      });
      posthog.capture("stock_lot_added", {
        product_name: productName,
        initial_quantity: data.quantity,
        buy_price: Math.round(data.buyPrice * 100) / 100,
        is_stocked: isStocked,
      });
      resetForm();
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add lot");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <>
      {children(() => setIsOpen(true))}
      <Modal
        isOpen={isOpen}
        onClose={() => {
          resetForm();
          setIsOpen(false);
        }}
        title={`Add Stock — ${productName}`}
      >
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Lot Quantity"
                htmlFor="lot-quantity"
                error={errors.quantity?.message}
              >
                <Input
                  id="lot-quantity"
                  type="number"
                  min="1"
                  step="1"
                  error={!!errors.quantity}
                  {...register("quantity", { valueAsNumber: true })}
                />
              </FormField>
              <FormField
                label="Unit Buy Price"
                htmlFor="lot-buyPrice"
                error={errors.buyPrice?.message}
              >
                <Controller
                  name="buyPrice"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      id="lot-buyPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      error={!!errors.buyPrice}
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const n = parseFloat(e.target.value);
                        field.onChange(Number.isNaN(n) ? undefined : n);
                      }}
                    />
                  )}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="dateReceived"
                control={control}
                render={({ field, fieldState }) => (
                  <FormField
                    label="Date Received"
                    className="flex flex-col"
                    error={fieldState.error?.message}
                  >
                    <div className="w-full flex">
                      <DatePickerInput
                        onChange={(val) => field.onChange(val ?? undefined)}
                        value={field.value ?? null}
                        error={!!fieldState.error}
                      />
                    </div>
                  </FormField>
                )}
              />

              <FormField label="Lot Identity" htmlFor="lot-lotIdentity">
                <Input
                  id="lot-lotIdentity"
                  placeholder="e.g. L-20260430-143052"
                  {...register("lotIdentity")}
                />
              </FormField>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <StatusToggle value={isStocked} onChange={setIsStocked} />
            </div>

            <FormField
              label="Notes"
              htmlFor="lot-notes"
              hint="optional, max 75 chars"
            >
              <NotesField id="lot-notes" value={notes} onChange={setNotes} />
            </FormField>
          </div>

          <ModalActions
            submitLabel="Add Lot"
            loadingLabel="Adding..."
            isLoading={isSubmitting}
            onCancel={() => {
              resetForm();
              setIsOpen(false);
            }}
          />
        </form>
      </Modal>
    </>
  );
}
