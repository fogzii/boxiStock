"use client";

import { CustomTooltip, FormField, Input, Modal, ModalActions } from "@box-ds";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import * as React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { addProduct, getAllProductNames } from "@/actions/stock/inventory";
import {
  LotFormFields,
  lotFormDefaults,
  lotFormSchema,
} from "@/components/stock/lotFormFields";
import { toCalendarDay } from "@/lib/date";

function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 70;
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length
    ? Math.max(10, Math.floor(50 * (q.length / t.length)))
    : -1;
}

// The same lot fields as `addLotModal`, plus the name of the product the first
// lot belongs to.
const schema = lotFormSchema.extend({
  name: z.string().min(1, "Product name is required"),
});

type FormData = z.infer<typeof schema>;

function formDefaults() {
  return { name: "", ...lotFormDefaults() };
}

interface AddProductModalProps {
  children?: ((open: () => void) => React.ReactNode) | React.ReactNode;
  trigger?: React.ReactNode;
}

export function AddProductModal({ children, trigger }: AddProductModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isStocked, setIsStocked] = React.useState(true);
  const [notes, setNotes] = React.useState("");
  const [recentProducts, setRecentProducts] = React.useState<
    { id: string; name: string }[]
  >([]);
  const [nameQuery, setNameQuery] = React.useState("");
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: true,
    defaultValues: formDefaults(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = form;

  React.useEffect(() => {
    getAllProductNames()
      .then(setRecentProducts)
      .catch(() => {});
  }, []);

  const suggestions = React.useMemo(() => {
    const q = nameQuery.trim();
    if (!q) return recentProducts.slice(0, 3);
    return recentProducts
      .map((p) => ({ p, score: fuzzyScore(q, p.name) }))
      .filter(({ score }) => score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ p }) => p);
  }, [nameQuery, recentProducts]);

  const resetForm = () => {
    form.reset(formDefaults());
    setIsStocked(true);
    setNotes("");
    setNameQuery("");
  };

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    const parsedPrice = Math.round(data.buyPrice * 100) / 100;
    try {
      await addProduct({
        name: data.name,
        initialQuantity: data.quantity,
        buyPrice: parsedPrice,
        isStocked,
        dateAcquired: toCalendarDay(data.dateReceived ?? new Date()),
        lotIdentity: data.lotIdentity ?? "",
        notes,
      });
      posthog.capture("stock_added", {
        product_name: data.name,
        initial_quantity: data.quantity,
        buy_price: parsedPrice,
        is_stocked: isStocked,
      });
      resetForm();
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add stock",
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <>
      {typeof children === "function" ? (
        children(() => setIsOpen(true))
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-block bg-transparent p-0 border-0 text-left"
        >
          {trigger || children}
        </button>
      )}
      <Modal
        isOpen={isOpen}
        onClose={() => {
          resetForm();
          setIsOpen(false);
        }}
        title="Add Stock"
      >
        <FormProvider {...form}>
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
            <div className="space-y-5">
              <FormField
                label="Product Name"
                htmlFor="name"
                error={errors.name?.message}
              >
                <Input
                  id="name"
                  type="text"
                  placeholder="Product Name"
                  error={!!errors.name}
                  {...register("name", {
                    onChange: (e) => setNameQuery(e.target.value),
                  })}
                />
                {suggestions.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-0.5">
                    <span className="text-caption text-muted-foreground/50 shrink-0 uppercase tracking-wide">
                      {nameQuery.trim() ? "Matches:" : "Suggested:"}
                    </span>
                    {suggestions.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setValue("name", p.name);
                          setNameQuery(p.name);
                        }}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-caption bg-primary/10 text-primary/80 border border-primary/20 hover:bg-primary/20 hover:text-primary hover:border-primary/40 transition-all cursor-pointer"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </FormField>

              <LotFormFields
                idPrefix="product"
                quantityLabel="Initial Lot Quantity"
                isStocked={isStocked}
                onStockedChange={setIsStocked}
                notes={notes}
                onNotesChange={setNotes}
              />
            </div>

            <ModalActions
              submitLabel="Add to Inventory"
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

export function AddStockButton() {
  return (
    <AddProductModal>
      {(open) => (
        <CustomTooltip
          content={
            <span className="block max-w-[15rem] leading-relaxed">
              Add a new product or lot to inventory.
            </span>
          }
        >
          <button
            type="button"
            onClick={open}
            className="flex h-9 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg bg-primary px-4 text-body-sm-strong text-primary-foreground transition-all hover:bg-primary-active"
          >
            <PlusCircle className="h-4 w-4" />
            Add stock
          </button>
        </CustomTooltip>
      )}
    </AddProductModal>
  );
}
