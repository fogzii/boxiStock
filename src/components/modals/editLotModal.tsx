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
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateLot } from "@/actions/stock/inventory";
import type { StockLot } from "@/components/stock/lotCard";
import { NotesField } from "@/components/ui/NotesField";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { parseCalendarDay, toCalendarDay } from "@/lib/date";
import {
  buyPriceSchema,
  lotIdentitySchema,
  optionalDateSchema,
  quantitySchema,
} from "@/lib/schemas";
import type { DatePickerValue } from "@/lib/types";

const schema = z.object({
  quantity: quantitySchema,
  buyPrice: buyPriceSchema,
  dateAcquired: optionalDateSchema,
  lotIdentity: lotIdentitySchema,
});

type FormData = z.infer<typeof schema>;

interface EditLotModalProps {
  lot: StockLot;
  productName: string;
  children: (open: () => void) => React.ReactNode;
}

export function EditLotModal({
  lot,
  productName,
  children,
}: EditLotModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isStocked, setIsStocked] = React.useState(lot.isStocked);
  const [notes, setNotes] = React.useState(lot.notes ?? "");
  const router = useRouter();

  const lotRef = lot.lotIdentity || lot.id.slice(-6).toUpperCase();

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
      quantity: lot.remainingQuantity,
      buyPrice: lot.buyPrice,
      dateAcquired: parseCalendarDay(lot.dateAcquired) ?? new Date(),
      lotIdentity: lot.lotIdentity ?? "",
    },
  });

  const resetForm = () => {
    reset({
      quantity: lot.remainingQuantity,
      buyPrice: lot.buyPrice,
      dateAcquired: parseCalendarDay(lot.dateAcquired) ?? new Date(),
      lotIdentity: lot.lotIdentity ?? "",
    });
    setIsStocked(lot.isStocked);
    setNotes(lot.notes ?? "");
  };

  const handleClose = () => {
    resetForm();
    setIsOpen(false);
  };

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    const parsedPrice = Math.round(data.buyPrice * 100) / 100;
    try {
      await updateLot(lot.id, {
        remainingQuantity: data.quantity,
        buyPrice: parsedPrice,
        isStocked,
        dateAcquired: toCalendarDay(
          data.dateAcquired ?? parseCalendarDay(lot.dateAcquired) ?? new Date(),
        ),
        lotIdentity: data.lotIdentity ?? "",
        notes,
      });
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update lot",
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
        title={`Edit Lot — ${productName}`}
      >
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
          <p className="text-body-sm text-foreground/80 bg-primary/10 p-3 rounded-lg border border-primary/20">
            Editing{" "}
            <strong className="text-foreground">
              {lot.lotIdentity ? lot.lotIdentity : `Lot #${lotRef}`}
            </strong>
            . Initial quantity was{" "}
            <strong className="text-primary">{lot.initialQuantity}</strong>{" "}
            units.
          </p>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Remaining Quantity"
                htmlFor="edit-quantity"
                error={errors.quantity?.message}
              >
                <Input
                  id="edit-quantity"
                  type="number"
                  min="1"
                  step="1"
                  error={!!errors.quantity}
                  {...register("quantity", { valueAsNumber: true })}
                />
              </FormField>
              <FormField
                label="Unit Buy Price"
                htmlFor="edit-buyPrice"
                error={errors.buyPrice?.message}
              >
                <Controller
                  name="buyPrice"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      id="edit-buyPrice"
                      type="number"
                      min="0"
                      step="0.01"
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
                name="dateAcquired"
                control={control}
                render={({ field, fieldState }) => (
                  <FormField
                    label="Date Acquired"
                    className="flex flex-col"
                    error={fieldState.error?.message}
                  >
                    <div className="w-full flex">
                      <DatePickerInput
                        onChange={(val) =>
                          field.onChange(val as DatePickerValue)
                        }
                        value={field.value ?? null}
                        error={!!fieldState.error}
                      />
                    </div>
                  </FormField>
                )}
              />

              <FormField label="Lot Identity" htmlFor="edit-lotIdentity">
                <Input
                  id="edit-lotIdentity"
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
              htmlFor="edit-notes"
              hint="optional, max 75 chars"
            >
              <NotesField id="edit-notes" value={notes} onChange={setNotes} />
            </FormField>
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
