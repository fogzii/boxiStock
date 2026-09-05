"use client";

import { CurrencyInput, FormField, Input, Modal, ModalActions } from "@box-ds";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  getSuggestedSellPrice,
  updateProduct,
} from "@/actions/stock/inventory";
import { formatSignedAmount, round2 } from "@/lib/formatting";
import {
  projectableQuantity,
  toSellPrice,
  weightedAvgBuyPrice,
} from "@/lib/stock/projections";
import type { ProductWithLots } from "@/lib/stock/types";

// Sell price is the only thing the user sets. Projected profit is shown back to
// them as a derived read-out (sell - weighted average cost) rather than a second
// input, since editing margin directly isn't how anyone prices stock.
const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(200, "Must be 200 characters or fewer"),
  sellPrice: z
    .number({ error: "Enter a valid number" })
    .min(0, "Must be 0 or greater")
    .max(1_000_000_000, "Exceeds maximum")
    .nullable(),
});

type FormData = z.infer<typeof schema>;

/**
 * Which half of the row this modal edits. The stock row's action menu offers
 * name and sell price as separate entries, so each opens the modal focused on
 * one field; "all" keeps both in a single form for any caller that wants it.
 */
export type EditProductField = "all" | "name" | "sellPrice";

const TITLES: Record<EditProductField, string> = {
  all: "Edit Row",
  name: "Edit Name",
  sellPrice: "Edit Sell Price",
};

interface EditProductModalProps {
  product: ProductWithLots;
  field?: EditProductField;
  children: (open: () => void) => React.ReactNode;
}

export function EditProductModal({
  product,
  field = "all",
  children,
}: EditProductModalProps) {
  const showName = field !== "sellPrice";
  const showSellPrice = field !== "name";
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  // Lowest price this name has ever sold for. Fetched on open rather than
  // passed down per row, so listing a page of products stays one query.
  const [suggestedSellPrice, setSuggestedSellPrice] = React.useState<
    number | null
  >(null);
  const router = useRouter();

  const avgBuyPrice = weightedAvgBuyPrice(product.lots) ?? 0;
  const quantity = projectableQuantity(product.lots);

  const defaults = React.useMemo<FormData>(
    () => ({
      name: product.name,
      sellPrice: toSellPrice(product.sellPrice),
    }),
    [product.name, product.sellPrice],
  );

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
    defaultValues: defaults,
  });

  const watchedSellPrice = watch("sellPrice");

  const handleOpen = () => {
    reset(defaults);
    setIsOpen(true);
    if (!showSellPrice) return;
    // Advisory only — a failure here just means no "lowest past sale" hint.
    getSuggestedSellPrice(product.name)
      .then(setSuggestedSellPrice)
      .catch(() => setSuggestedSellPrice(null));
  };

  const handleClose = () => {
    reset(defaults);
    setIsOpen(false);
  };

  const applySuggested = () => {
    if (suggestedSellPrice === null) return;
    setValue("sellPrice", suggestedSellPrice);
    clearErrors("sellPrice");
  };

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      await updateProduct(product.id, {
        name: data.name,
        sellPrice: data.sellPrice === null ? null : round2(data.sellPrice),
      });
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update product",
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  const price = toSellPrice(watchedSellPrice);
  const profitPerUnit = price === null ? null : round2(price - avgBuyPrice);
  const profitTotal =
    profitPerUnit === null ? null : round2(profitPerUnit * quantity);

  return (
    <>
      {children(handleOpen)}
      <Modal isOpen={isOpen} onClose={handleClose} title={TITLES[field]}>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
          {showSellPrice && (
            <p className="text-body-sm text-foreground/80 bg-primary/10 p-3 rounded-lg border border-primary/20">
              <strong className="text-primary">{quantity}</strong> units
              remaining at an average cost of{" "}
              <strong className="text-primary">
                ${avgBuyPrice.toFixed(2)}
              </strong>{" "}
              each.
            </p>
          )}

          <div className="space-y-5">
            {showName && (
              <FormField
                label="Product Name"
                htmlFor="edit-product-name"
                error={errors.name?.message}
              >
                <Input
                  id="edit-product-name"
                  error={!!errors.name}
                  {...register("name")}
                />
              </FormField>
            )}

            {showSellPrice && (
              <>
                <FormField
                  label="Sell Price (per unit)"
                  htmlFor="edit-sellPrice"
                  hint="leave blank for NA"
                  error={errors.sellPrice?.message}
                >
                  <Controller
                    name="sellPrice"
                    control={control}
                    render={({ field }) => (
                      <CurrencyInput
                        id="edit-sellPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="NA"
                        error={!!errors.sellPrice}
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const n = parseFloat(e.target.value);
                          field.onChange(Number.isNaN(n) ? null : n);
                        }}
                        onBlur={(e) => {
                          field.onBlur();
                          const n = parseFloat(e.target.value);
                          if (Number.isFinite(n))
                            setValue("sellPrice", round2(n));
                        }}
                      />
                    )}
                  />
                </FormField>

                {/* Derived read-out, not an input — mirrors the table's two views. */}
                <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
                  <span className="text-body-sm text-muted-foreground">
                    Est. profit
                  </span>
                  {profitPerUnit === null ? (
                    <span className="text-body-sm-strong text-muted-foreground">
                      NA
                    </span>
                  ) : (
                    <span className="text-body-sm-strong text-foreground">
                      {formatSignedAmount(profitPerUnit)}
                      <span className="text-muted-foreground"> / unit · </span>
                      {formatSignedAmount(profitTotal ?? 0)}
                      <span className="text-muted-foreground">
                        {" "}
                        across {quantity}
                      </span>
                    </span>
                  )}
                </div>

                {suggestedSellPrice !== null && (
                  <p className="text-caption text-foreground/50">
                    Lowest past sale price was ${suggestedSellPrice.toFixed(2)}.{" "}
                    <button
                      type="button"
                      onClick={applySuggested}
                      className="text-primary hover:text-primary-active underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      Use it
                    </button>
                  </p>
                )}
              </>
            )}
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
