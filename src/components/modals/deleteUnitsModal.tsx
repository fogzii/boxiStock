"use client";

import { FormField, Input, Modal, ModalActions } from "@box-ds";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { deleteLotUnits } from "@/actions/stock/inventory";
import type { StockLot } from "@/components/stock/lotCard";

interface DeleteUnitsModalProps {
  children: (open: () => void) => React.ReactNode;
  lot: StockLot;
  productName: string;
}

export function DeleteUnitsModal({
  children,
  lot,
  productName,
}: DeleteUnitsModalProps) {
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
      }),
    [lot.remainingQuantity],
  );

  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { quantity: lot.remainingQuantity },
  });

  React.useEffect(() => {
    reset({ quantity: lot.remainingQuantity });
  }, [lot.remainingQuantity, reset]);

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      await deleteLotUnits(lot.id, data.quantity);
      posthog.capture("units_deleted", {
        product_name: productName,
        quantity_deleted: data.quantity,
      });
      reset();
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete units",
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
        onClose={() => {
          reset();
          setIsOpen(false);
        }}
        title="Delete Units"
      >
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
          <div>
            <p className="text-body-sm text-foreground/80 bg-negative-bg p-3 rounded-lg border border-negative/20">
              You are about to delete units from{" "}
              <strong className="text-foreground">{productName}</strong> (Lot{" "}
              <strong className="text-foreground">{lotRef}</strong>).
              <br />
              There are currently{" "}
              <strong className="text-destructive">
                {lot.remainingQuantity}
              </strong>{" "}
              units available in stock.
            </p>
          </div>
          <FormField
            label="Number of units to delete"
            htmlFor="quantity"
            error={errors.quantity?.message}
          >
            <Input
              id="quantity"
              type="number"
              min="1"
              max={lot.remainingQuantity}
              error={!!errors.quantity}
              {...register("quantity", { valueAsNumber: true })}
            />
          </FormField>

          <ModalActions
            submitLabel="Confirm Deletion"
            loadingLabel="Processing..."
            isLoading={isSubmitting}
            disabled={lot.remainingQuantity === 0}
            onCancel={() => {
              reset();
              setIsOpen(false);
            }}
            destructive
          />
        </form>
      </Modal>
    </>
  );
}
