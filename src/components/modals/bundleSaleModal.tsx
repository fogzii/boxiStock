"use client";

import {
  Button,
  CustomTooltip,
  DatePickerInput,
  FormField,
  Input,
  Label,
  Modal,
  Skeleton,
} from "@box-ds";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  PackagePlus,
  Search,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createBundle } from "@/actions/stock/bundles";
import { getInventoryPaginated } from "@/actions/stock/inventory";
import { formatCurrency, round2 } from "@/lib/formatting";
import { optionalDateSchema, sellPriceSchema } from "@/lib/schemas";
import type {
  BundleInventoryLot,
  PaginatedInventoryProduct,
} from "@/lib/stock/types";
import type { DatePickerValue } from "@/lib/types";

type PaginatedLot = BundleInventoryLot;
type PaginatedProduct = PaginatedInventoryProduct;

interface BundleItemEntry {
  productId: string;
  productName: string;
  quantity: number;
  lots: PaginatedLot[];
}

interface FifoBreakdownEntry {
  lotId: string;
  lotRef: string;
  qty: number;
  buyPrice: number;
  fullyDepleted: boolean;
}

function computeFifo(
  lots: PaginatedLot[],
  quantity: number,
): { breakdown: FifoBreakdownEntry[]; totalBuy: number; hasEnough: boolean } {
  const sorted = [...lots].sort(
    (a, b) =>
      new Date(a.dateAcquired).getTime() - new Date(b.dateAcquired).getTime(),
  );
  const breakdown: FifoBreakdownEntry[] = [];
  let remaining = quantity;
  let totalBuy = 0;

  for (const lot of sorted) {
    if (remaining <= 0) break;
    const take = Math.min(lot.remainingQuantity, remaining);
    const lotRef = lot.lotIdentity ?? lot.id.slice(-6).toUpperCase();
    breakdown.push({
      lotId: lot.id,
      lotRef,
      qty: take,
      buyPrice: lot.buyPrice,
      fullyDepleted: take === lot.remainingQuantity,
    });
    totalBuy += take * lot.buyPrice;
    remaining -= take;
  }

  return { breakdown, totalBuy: round2(totalBuy), hasEnough: remaining === 0 };
}

function totalAvailable(lots: PaginatedLot[]) {
  return lots.reduce((s, l) => s + l.remainingQuantity, 0);
}

const schema = z.object({
  bundleName: z.string().min(1, "Bundle name is required"),
  sellPrice: sellPriceSchema,
  dateSold: optionalDateSchema,
});

type FormData = z.infer<typeof schema>;

interface BundleSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRODUCT_LIST_ROWS = 5;
const SKELETON_ROW_KEYS = Array.from(
  { length: PRODUCT_LIST_ROWS },
  (_, i) => `bundle-skeleton-${i}`,
);

function BundleSaleModal({ isOpen, onClose }: BundleSaleModalProps) {
  const router = useRouter();

  const [bundleItems, setBundleItems] = React.useState<BundleItemEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const sellPriceMeasureRef = React.useRef<HTMLSpanElement>(null);
  const [sellPriceInputWidth, setSellPriceInputWidth] = React.useState(58);

  const [productSearch, setProductSearch] = React.useState("");
  const [productPage, setProductPage] = React.useState(1);
  const [searchResults, setSearchResults] = React.useState<PaginatedProduct[]>(
    [],
  );
  const [searchTotalPages, setSearchTotalPages] = React.useState(1);
  const [searchLoading, setSearchLoading] = React.useState(false);

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
      bundleName: "",
      sellPrice: undefined,
      dateSold: new Date(),
    },
  });

  const watchedSellPrice = watch("sellPrice");

  // biome-ignore lint/correctness/useExhaustiveDependencies: sellPrice triggers DOM remeasure of the hidden span
  React.useEffect(() => {
    if (!sellPriceMeasureRef.current) return;
    const w = sellPriceMeasureRef.current.offsetWidth;
    setSellPriceInputWidth(Math.max(58, Math.min(w + 32, 144)));
  }, [watchedSellPrice]);

  React.useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const result = await getInventoryPaginated(
          productPage,
          PRODUCT_LIST_ROWS,
          productSearch || undefined,
        );
        setSearchResults(result.products as PaginatedProduct[]);
        setSearchTotalPages(result.totalPages ?? 1);
      } catch {
        // ignore
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [isOpen, productSearch, productPage]);

  function resetForm() {
    reset({
      bundleName: "",
      sellPrice: undefined,
      dateSold: new Date(),
    });
    setBundleItems([]);
    setProductSearch("");
    setProductPage(1);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function addProduct(product: PaginatedProduct) {
    if (bundleItems.some((i) => i.productId === product.id)) return;
    const avail = totalAvailable(product.lots);
    if (avail === 0) return;
    setBundleItems((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        quantity: avail,
        lots: product.lots,
      },
    ]);
  }

  function removeProduct(productId: string) {
    setBundleItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function updateQuantity(productId: string, value: string) {
    const qty = parseInt(value, 10);
    setBundleItems((prev) =>
      prev.map((i) => {
        if (i.productId !== productId) return i;
        const max = totalAvailable(i.lots);
        return {
          ...i,
          quantity: Number.isNaN(qty) ? 1 : Math.max(1, Math.min(qty, max)),
        };
      }),
    );
  }

  const itemsWithFifo = bundleItems.map((item) => ({
    ...item,
    fifo: computeFifo(item.lots, item.quantity),
  }));

  const totalBuyCost = round2(
    itemsWithFifo.reduce((s, i) => s + i.fifo.totalBuy, 0),
  );
  const sellPrice = Number(watchedSellPrice) || 0;
  const totalProfit = round2(sellPrice - totalBuyCost);
  const perProductProfit =
    bundleItems.length > 0 ? round2(totalProfit / bundleItems.length) : 0;

  const hasInvalidFifo = itemsWithFifo.some((i) => !i.fifo.hasEnough);

  const onSubmit = handleSubmit(async (data) => {
    if (bundleItems.length < 1 || hasInvalidFifo) {
      toast.error(
        hasInvalidFifo
          ? "Insufficient stock for one or more items."
          : "Add at least one product to the bundle.",
      );
      return;
    }
    setIsSubmitting(true);
    try {
      await createBundle({
        name: data.bundleName.trim(),
        totalSellPrice: round2(Number(data.sellPrice) || 0),
        dateSold: data.dateSold instanceof Date ? data.dateSold : new Date(),
        items: bundleItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      });
      toast.success(`Bundle "${data.bundleName.trim()}" recorded.`);
      handleClose();
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to record bundle sale.",
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  const addedIds = new Set(bundleItems.map((i) => i.productId));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bundle Sale"
      className="sm:max-w-2xl"
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
        <div className="space-y-5">
          <FormField
            label="Bundle Name"
            htmlFor="bundle-name"
            error={undefined}
          >
            <Input
              id="bundle-name"
              placeholder="Bundle Name"
              error={!!errors.bundleName}
              {...register("bundleName")}
            />
          </FormField>

          <div className="space-y-2">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
              </div>
              <Input
                id="bundle-product-search"
                type="search"
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setProductPage(1);
                }}
                placeholder="Search products to add…"
                aria-label="Search products to add to this bundle"
                autoComplete="off"
                className="pl-9"
              />
            </div>
            <div className="border border-primary/20 rounded-lg overflow-hidden bg-background/50">
              <ul className="divide-y divide-primary/10">
                {searchLoading
                  ? SKELETON_ROW_KEYS.map((key) => (
                      <li
                        key={key}
                        className="flex items-center justify-between px-4 py-2.5 h-[44px]"
                      >
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-6 w-14 rounded-md" />
                      </li>
                    ))
                  : searchResults.length === 0
                    ? Array.from({ length: PRODUCT_LIST_ROWS }).map((_, i) => (
                        <li
                          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder
                          key={i}
                          className="flex items-center px-4 h-[44px]"
                        >
                          {i === 0 && (
                            <span className="text-body-sm text-muted-foreground/50">
                              No products found.
                            </span>
                          )}
                        </li>
                      ))
                    : searchResults.map((product) => {
                        const avail = totalAvailable(product.lots);
                        const isAdded = addedIds.has(product.id);
                        const hasStock = avail > 0;
                        return (
                          <li
                            key={product.id}
                            className="flex items-center justify-between px-4 py-2.5 h-[44px]"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`text-body-sm truncate ${!hasStock ? "text-muted-foreground/50" : "text-foreground"}`}
                              >
                                {product.name}
                              </span>
                              <span className="text-caption text-muted-foreground/50 shrink-0">
                                {avail} avail.
                              </span>
                            </div>
                            <button
                              type="button"
                              disabled={isAdded || !hasStock}
                              onClick={() => addProduct(product)}
                              className={`text-caption px-2.5 py-1 rounded-md transition-colors shrink-0 ml-2 cursor-pointer ${
                                isAdded
                                  ? "bg-primary/10 text-primary cursor-default"
                                  : hasStock
                                    ? "bg-primary/20 hover:bg-primary/30 text-primary"
                                    : "opacity-30 cursor-not-allowed text-muted-foreground"
                              }`}
                            >
                              {isAdded ? "Added" : "+ Add"}
                            </button>
                          </li>
                        );
                      })}
              </ul>
              <div className="flex items-center justify-center gap-2 py-2 border-t border-primary/10 h-[36px]">
                {searchTotalPages > 1 && (
                  <>
                    <button
                      type="button"
                      disabled={productPage === 1}
                      onClick={() => setProductPage((p) => p - 1)}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-default cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-caption text-muted-foreground">
                      {productPage} / {searchTotalPages}
                    </span>
                    <button
                      type="button"
                      disabled={productPage === searchTotalPages}
                      onClick={() => setProductPage((p) => p + 1)}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-default cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {bundleItems.length > 0 && (
            <div className="space-y-2">
              <Label>Bundle Items</Label>
              <div className="space-y-2">
                {itemsWithFifo.map((item) => {
                  const max = totalAvailable(item.lots);
                  return (
                    <div
                      key={item.productId}
                      className="border border-primary/20 rounded-lg p-3 bg-background/50 space-y-2"
                    >
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-body-sm-strong flex-1 text-foreground">
                          {item.productName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-caption text-muted-foreground whitespace-nowrap">
                            Qty:
                          </span>
                          <Input
                            type="number"
                            min="1"
                            max={max}
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(item.productId, e.target.value)
                            }
                            className="w-20 h-9 text-body-sm"
                          />
                          <span className="text-caption text-muted-foreground/50">
                            / {max}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeProduct(item.productId)}
                          className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                          aria-label={`Remove ${item.productName}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="pl-7 space-y-0.5">
                        {item.fifo.breakdown.map((b) => (
                          <div
                            key={b.lotId}
                            className="flex items-center gap-2 text-caption text-muted-foreground"
                          >
                            <span className="text-muted-foreground/40">↳</span>
                            <span>
                              Lot {b.lotRef}: {b.qty} unit
                              {b.qty !== 1 ? "s" : ""} @{" "}
                              {formatCurrency(b.buyPrice)}
                              {b.fullyDepleted && (
                                <span className="ml-1.5 text-warning/80 text-caption">
                                  (depleted)
                                </span>
                              )}
                            </span>
                            <span className="ml-auto text-muted-foreground/60">
                              {formatCurrency(round2(b.qty * b.buyPrice))}
                            </span>
                          </div>
                        ))}
                        {!item.fifo.hasEnough && (
                          <p className="text-caption text-destructive mt-1">
                            Insufficient stock for this quantity.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <FormField
              label="Pricing"
              htmlFor="sell-price"
              error={errors.sellPrice?.message}
            >
              <div className="border border-primary/20 rounded-lg bg-background/50 divide-y divide-primary/10">
                <div className="flex items-center justify-between pl-4 pr-5 h-11">
                  <span className="text-body-sm text-muted-foreground">
                    Total buy cost
                  </span>
                  <span className="text-body-sm-strong text-foreground">
                    {formatCurrency(totalBuyCost)}
                  </span>
                </div>

                <div className="flex items-center justify-between pl-4 pr-3 h-11 gap-4">
                  <span className="text-body-sm text-muted-foreground shrink-0">
                    Sell price
                  </span>
                  <Controller
                    name="sellPrice"
                    control={control}
                    render={({ field }) => (
                      <div
                        className="relative transition-[width] duration-100"
                        style={{ width: sellPriceInputWidth }}
                      >
                        <span
                          ref={sellPriceMeasureRef}
                          aria-hidden
                          className="absolute invisible whitespace-nowrap text-body-sm pointer-events-none"
                        >
                          {String(field.value || "0.00")}
                        </span>
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-body-sm text-muted-foreground pointer-events-none">
                          $
                        </span>
                        <Input
                          id="sell-price"
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-full pl-4 h-8 text-body-sm bg-background text-right pr-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0.00"
                          error={!!errors.sellPrice}
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                              const n = parseFloat(val);
                              field.onChange(Number.isNaN(n) ? undefined : n);
                            }
                          }}
                        />
                      </div>
                    )}
                  />
                </div>

                <div className="flex items-center justify-between pl-4 pr-5 h-11">
                  <span className="text-body-sm text-muted-foreground">
                    Total profit
                  </span>
                  <span
                    className={`text-body-sm-strong ${totalProfit >= 0 ? "text-positive" : "text-destructive"}`}
                  >
                    {totalProfit >= 0 ? "+" : ""}
                    {formatCurrency(totalProfit)}
                  </span>
                </div>

                {bundleItems.length > 0 &&
                  typeof watchedSellPrice === "number" && (
                    <div className="flex items-center justify-between pl-4 pr-5 h-9">
                      <span className="text-caption text-muted-foreground/50">
                        Profit will be split equally across {bundleItems.length}{" "}
                        product
                        {bundleItems.length !== 1 ? "s" : ""}
                      </span>
                      <span className="text-caption text-muted-foreground/50">
                        {formatCurrency(perProductProfit)} each
                      </span>
                    </div>
                  )}
              </div>
            </FormField>
          </div>

          <Controller
            name="dateSold"
            control={control}
            render={({ field, fieldState }) => (
              <FormField label="Date Sold" error={fieldState.error?.message}>
                <div className="w-full flex">
                  <DatePickerInput
                    onChange={(val) => field.onChange(val as DatePickerValue)}
                    value={field.value ?? null}
                    error={!!fieldState.error}
                  />
                </div>
              </FormField>
            )}
          />
        </div>

        <div className="flex flex-col sm:flex-row-reverse gap-3 mt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto h-12 shadow-glow-subtle sm:px-6"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Recording...
              </>
            ) : (
              "Record Bundle Sale"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto h-12 hover:bg-primary/5"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function BundleSaleButton() {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <>
      <CustomTooltip
        content={
          <span className="block max-w-[15rem] leading-relaxed">
            Sell several products together for one total price.
          </span>
        }
      >
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 h-9 px-4 text-body-sm-strong text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 rounded-lg transition-all whitespace-nowrap cursor-pointer"
        >
          <PackagePlus className="w-4 h-4" />
          Bundle sale
        </button>
      </CustomTooltip>
      <BundleSaleModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
