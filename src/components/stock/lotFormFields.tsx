"use client";

import {
  CurrencyInput,
  DatePickerInput,
  FormField,
  Input,
  Label,
} from "@box-ds";
import { Controller, useFormContext } from "react-hook-form";
import { z } from "zod";
import { NotesField } from "@/components/ui/NotesField";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { generateLotIdentity } from "@/lib/formatting";
import {
  buyPriceSchema,
  lotIdentitySchema,
  optionalDateSchema,
  quantitySchema,
} from "@/lib/schemas";

/**
 * The lot half of every "add stock" form. `addLotModal` uses it as-is;
 * `addProductModal` extends it with a product name, so the two stay one form
 * with one set of validation rules.
 */
export const lotFormSchema = z.object({
  quantity: quantitySchema,
  buyPrice: buyPriceSchema,
  dateReceived: optionalDateSchema,
  lotIdentity: lotIdentitySchema,
});

export type LotFormValues = z.infer<typeof lotFormSchema>;

/**
 * Fresh defaults for one lot. Called per open/reset rather than hoisted to a
 * constant: the generated lot identity is timestamped, so it has to be new
 * every time the form starts over.
 */
export function lotFormDefaults() {
  return {
    quantity: 1,
    buyPrice: undefined,
    dateReceived: new Date(),
    lotIdentity: generateLotIdentity(),
  };
}

interface LotFormFieldsProps {
  /** Namespaces the field ids so two instances can coexist in one document. */
  idPrefix: string;
  quantityLabel?: string;
  isStocked: boolean;
  onStockedChange: (isStocked: boolean) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
}

/**
 * Status and notes are plain state rather than form fields, so they arrive as
 * props; everything else is read from the surrounding `FormProvider`, which is
 * what lets a form with extra fields of its own reuse this block unchanged.
 */
export function LotFormFields({
  idPrefix,
  quantityLabel = "Lot Quantity",
  isStocked,
  onStockedChange,
  notes,
  onNotesChange,
}: LotFormFieldsProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<LotFormValues>();

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <FormField
          label={quantityLabel}
          htmlFor={`${idPrefix}-quantity`}
          error={errors.quantity?.message}
        >
          <Input
            id={`${idPrefix}-quantity`}
            type="number"
            min="1"
            step="1"
            error={!!errors.quantity}
            {...register("quantity", { valueAsNumber: true })}
          />
        </FormField>
        <FormField
          label="Unit Buy Price"
          htmlFor={`${idPrefix}-buyPrice`}
          error={errors.buyPrice?.message}
        >
          <Controller
            name="buyPrice"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                id={`${idPrefix}-buyPrice`}
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

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Controller
          name="dateReceived"
          control={control}
          render={({ field, fieldState }) => (
            <FormField
              label={isStocked ? "Date Received" : "Date Ordered"}
              className="flex flex-col"
              error={fieldState.error?.message}
            >
              <div className="w-full flex">
                <DatePickerInput
                  onChange={(val) =>
                    field.onChange(val instanceof Date ? val : undefined)
                  }
                  value={field.value ?? null}
                  error={!!fieldState.error}
                />
              </div>
            </FormField>
          )}
        />

        <FormField label="Lot Identity" htmlFor={`${idPrefix}-lotIdentity`}>
          <Input
            id={`${idPrefix}-lotIdentity`}
            placeholder="e.g. L-20260430-143052"
            {...register("lotIdentity")}
          />
        </FormField>
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <StatusToggle value={isStocked} onChange={onStockedChange} />
      </div>

      <FormField
        label="Notes"
        htmlFor={`${idPrefix}-notes`}
        hint="optional, max 75 chars"
      >
        <NotesField
          id={`${idPrefix}-notes`}
          value={notes}
          onChange={onNotesChange}
        />
      </FormField>
    </>
  );
}
