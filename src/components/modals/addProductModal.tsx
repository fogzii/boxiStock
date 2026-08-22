"use client";

import {
  CurrencyInput,
  CustomTooltip,
  DatePickerInput,
  FormField,
  Input,
  Label,
  Modal,
  ModalActions,
} from "@box-ds";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { addProduct, getAllProductNames } from "@/actions/stock/inventory";
import { NotesField } from "@/components/ui/NotesField";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { generateLotIdentity } from "@/lib/formatting";
import {
  buyPriceSchema,
  lotIdentitySchema,
  optionalDateSchema,
  quantitySchema,
} from "@/lib/schemas";
import type { DatePickerValue } from "@/lib/types";

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

const schema = z.object({
  name: z.string().min(1, "Product name is required"),
  quantity: quantitySchema,
  buyPrice: buyPriceSchema,
  dateReceived: optionalDateSchema,
  lotIdentity: lotIdentitySchema,
});

type FormData = z.infer<typeof schema>;

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

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: true,
    defaultValues: {
      name: "",
      quantity: 1,
      buyPrice: undefined,
      dateReceived: new Date(),
      lotIdentity: generateLotIdentity(),
    },
  });

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
    reset({
      name: "",
      quantity: 1,
      buyPrice: undefined,
      dateReceived: new Date(),
      lotIdentity: generateLotIdentity(),
    });
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
        dateAcquired: data.dateReceived ?? new Date(),
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
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
          <div className="space-y-5">
            <FormField label="Product Name" htmlFor="name" error={undefined}>
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

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <FormField
                label="Initial Lot Quantity"
                htmlFor="quantity"
                error={errors.quantity?.message}
              >
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  step="1"
                  error={!!errors.quantity}
                  {...register("quantity", { valueAsNumber: true })}
                />
              </FormField>
              <FormField
                label="Unit Buy Price"
                htmlFor="buyPrice"
                error={errors.buyPrice?.message}
              >
                <Controller
                  name="buyPrice"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      id="buyPrice"
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
                          field.onChange(val as DatePickerValue)
                        }
                        value={field.value ?? null}
                      />
                    </div>
                  </FormField>
                )}
              />

              <FormField label="Lot Identity" htmlFor="lotIdentity">
                <Input
                  id="lotIdentity"
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
              htmlFor="notes"
              hint="optional, max 75 chars"
            >
              <NotesField id="notes" value={notes} onChange={setNotes} />
            </FormField>
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
