"use client";

import { Modal, ModalActions } from "@box-ds";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import * as React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { addStockLot } from "@/actions/stock/inventory";
import {
  LotFormFields,
  type LotFormValues,
  lotFormDefaults,
  lotFormSchema,
} from "@/components/stock/lotFormFields";
import { toCalendarDay } from "@/lib/date";

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

  const form = useForm<LotFormValues>({
    resolver: zodResolver(lotFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: true,
    defaultValues: lotFormDefaults(),
  });

  const resetForm = () => {
    form.reset(lotFormDefaults());
    setIsStocked(true);
    setNotes("");
  };

  const onSubmit = form.handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      await addStockLot({
        productId,
        initialQuantity: data.quantity,
        buyPrice: Math.round(data.buyPrice * 100) / 100,
        isStocked,
        dateAcquired: toCalendarDay(data.dateReceived ?? new Date()),
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
        title={`Add Stock - ${productName}`}
      >
        <FormProvider {...form}>
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
            <div className="space-y-5">
              <LotFormFields
                idPrefix="lot"
                isStocked={isStocked}
                onStockedChange={setIsStocked}
                notes={notes}
                onNotesChange={setNotes}
              />
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
        </FormProvider>
      </Modal>
    </>
  );
}
