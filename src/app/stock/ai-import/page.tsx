"use client";

import {
  ArrowLeft,
  PackageSearch,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { bulkAddLotsAndProducts, bulkAddSales } from "@/actions/stock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAIImport } from "@/context/AIImportContext";

const _today = new Date();
const TODAY = `${String(_today.getDate()).padStart(2, "0")}-${String(_today.getMonth() + 1).padStart(2, "0")}-${_today.getFullYear()}`;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function clampPositiveInt(value: number): number {
  const n = Math.floor(value);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

/** Returns the input if it's a valid DD-MM-YYYY date, otherwise TODAY. */
function sanitiseDate(raw: string): string {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(raw.trim());
  if (!match) return TODAY;
  const d = new Date(`${match[3]}-${match[2]}-${match[1]}T00:00:00`);
  return Number.isNaN(d.getTime()) ? TODAY : raw.trim();
}

/** Converts DD-MM-YYYY to YYYY-MM-DD for server-side parsing. */
function ddmmyyyyToISO(value: string): string {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value.trim());
  if (!match) return value;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

export default function AIImportReviewPage() {
  const { importData, setImportData } = useAIImport();
  const router = useRouter();
  const [stockLots, setStockLots] = useState(importData?.stockLots || []);
  const [sales, setSales] = useState(importData?.sales || []);
  const [isSaving, setIsSaving] = useState(false);
  const leavingIntentionally = useRef(false);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!importData) {
      if (!leavingIntentionally.current) router.push("/stock");
    } else {
      setStockLots(importData.stockLots || []);
      setSales(importData.sales || []);
    }
  }, [importData, router]);

  if (!importData) return null;

  // ── Stock handlers ──────────────────────────────────────────────────────────
  const handleStockChange = (index: number, field: string, value: unknown) => {
    const updated = [...stockLots];
    updated[index] = { ...updated[index], [field]: value };
    setStockLots(updated);
  };

  const handleStockBlurPrice = (index: number, field: string) => {
    const lot = stockLots[index];
    const raw = lot[field as keyof typeof lot] as number;
    if (typeof raw === "number") handleStockChange(index, field, round2(raw));
  };

  const handleStockBlurQty = (index: number) => {
    const lot = stockLots[index];
    handleStockChange(
      index,
      "initialQuantity",
      clampPositiveInt(lot.initialQuantity),
    );
  };

  const handleAddStockRow = () => {
    setStockLots([
      ...stockLots,
      {
        name: "",
        initialQuantity: 1,
        buyPrice: 0,
        isStocked: true,
        notes: "",
        dateAcquired: TODAY,
      },
    ]);
    const newTotal = stockLots.length + 1;
    setPage(Math.ceil(newTotal / pageSize));
  };

  const handleDeleteStockRow = (index: number) => {
    const updated = stockLots.filter((_, i) => i !== index);
    setStockLots(updated);
    const maxPage = Math.max(1, Math.ceil(updated.length / pageSize));
    if (page > maxPage) setPage(maxPage);
  };

  // ── Sales handlers ──────────────────────────────────────────────────────────
  const handleSalesChange = (index: number, field: string, value: unknown) => {
    const updated = [...sales];
    updated[index] = { ...updated[index], [field]: value };
    setSales(updated);
  };

  const handleSalesBlurPrice = (index: number, field: string) => {
    const sale = sales[index];
    const raw = sale[field as keyof typeof sale] as number | undefined;
    if (typeof raw === "number") handleSalesChange(index, field, round2(raw));
  };

  const handleSalesBlurQty = (index: number) => {
    const sale = sales[index];
    handleSalesChange(
      index,
      "quantitySold",
      clampPositiveInt(sale.quantitySold),
    );
  };

  const handleAddSaleRow = () => {
    setSales([
      ...sales,
      {
        productName: "",
        quantitySold: 1,
        salePricePerUnit: 0,
        buyPrice: undefined,
        dateSold: TODAY,
        notes: "",
      },
    ]);
    const newTotal = sales.length + 1;
    setPage(Math.ceil(newTotal / pageSize));
  };

  const handleDeleteSaleRow = (index: number) => {
    const updated = sales.filter((_, i) => i !== index);
    setSales(updated);
    const maxPage = Math.max(1, Math.ceil(updated.length / pageSize));
    if (page > maxPage) setPage(maxPage);
  };

  // ── Confirm / cancel ────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      if (importData.type === "stock") {
        await bulkAddLotsAndProducts(
          stockLots.map((lot) => ({
            ...lot,
            dateAcquired: lot.dateAcquired
              ? ddmmyyyyToISO(lot.dateAcquired)
              : lot.dateAcquired,
          })),
        );
        toast.success("Stock lots added successfully!");
      } else {
        await bulkAddSales(
          sales.map((sale) => ({
            ...sale,
            dateSold: sale.dateSold
              ? ddmmyyyyToISO(sale.dateSold)
              : sale.dateSold,
          })),
        );
        toast.success("Sales added successfully!");
      }
      leavingIntentionally.current = true;
      setImportData(null);
      router.push(importData.type === "sales" ? "/sales" : "/stock");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save data.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    const dest = importData.type === "sales" ? "/sales" : "/stock";
    leavingIntentionally.current = true;
    setImportData(null);
    router.push(dest);
  };

  const handleTryAgain = () => {
    router.push("/stock?reopen-ai=true");
  };

  // ── Shared styles ───────────────────────────────────────────────────────────
  const ci =
    "h-9 px-2 bg-transparent border-transparent hover:border-primary/20 focus:bg-background w-full";

  // ── Stock table ─────────────────────────────────────────────────────────────
  const renderStockTable = () => {
    const totalPages = Math.ceil(stockLots.length / pageSize);
    const paginated = stockLots.slice((page - 1) * pageSize, page * pageSize);

    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {/* min-w keeps it scrollable on mobile; colgroup pins narrow cols */}
            <table className="w-full min-w-[700px] text-sm text-left">
              <colgroup>
                <col />
                <col style={{ width: "80px" }} />
                <col style={{ width: "80px" }} />
                <col />
                <col style={{ width: "108px" }} />
                <col style={{ width: "40px" }} />
              </colgroup>
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-4 py-4 font-semibold">Product Name</th>
                  <th className="px-2 py-4 font-semibold text-right">Qty</th>
                  <th className="px-2 py-4 font-semibold text-right">Price</th>
                  <th className="px-4 py-4 font-semibold">Notes</th>
                  <th className="px-2 py-4 font-semibold text-center whitespace-nowrap">
                    Received date
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.map((item, idx) => {
                  const globalIdx = (page - 1) * pageSize + idx;
                  return (
                    <tr
                      key={globalIdx}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-2">
                        <Input
                          value={item.name}
                          onChange={(e) =>
                            handleStockChange(globalIdx, "name", e.target.value)
                          }
                          className={ci}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={item.initialQuantity}
                          onChange={(e) =>
                            handleStockChange(
                              globalIdx,
                              "initialQuantity",
                              parseInt(e.target.value, 10) || 1,
                            )
                          }
                          onBlur={() => handleStockBlurQty(globalIdx)}
                          className={`${ci} text-right`}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.buyPrice}
                          onChange={(e) =>
                            handleStockChange(
                              globalIdx,
                              "buyPrice",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          onBlur={() =>
                            handleStockBlurPrice(globalIdx, "buyPrice")
                          }
                          className={`${ci} text-right`}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          value={item.notes || ""}
                          placeholder="Optional"
                          onChange={(e) =>
                            handleStockChange(
                              globalIdx,
                              "notes",
                              e.target.value,
                            )
                          }
                          className={`${ci} placeholder:text-muted-foreground/50`}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          type="text"
                          value={item.dateAcquired || TODAY}
                          onChange={(e) =>
                            handleStockChange(
                              globalIdx,
                              "dateAcquired",
                              e.target.value,
                            )
                          }
                          onBlur={() =>
                            handleStockChange(
                              globalIdx,
                              "dateAcquired",
                              sanitiseDate(item.dateAcquired || TODAY),
                            )
                          }
                          placeholder="DD-MM-YYYY"
                          className={`${ci} min-w-[100px] placeholder:text-muted-foreground/40`}
                        />
                      </td>
                      <td className="py-2 pr-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteStockRow(globalIdx)}
                          className="cursor-pointer p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          aria-label="Delete row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add row */}
          <div className="px-5 py-2 border-t border-border/50">
            <button
              type="button"
              onClick={handleAddStockRow}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add row
            </button>
          </div>
        </div>
        {totalPages > 1 && renderPagination(totalPages)}
      </div>
    );
  };

  // ── Sales table ─────────────────────────────────────────────────────────────
  const renderSalesTable = () => {
    const totalPages = Math.ceil(sales.length / pageSize);
    const paginated = sales.slice((page - 1) * pageSize, page * pageSize);

    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm text-left">
              <colgroup>
                <col />
                <col style={{ width: "80px" }} />
                <col style={{ width: "80px" }} />
                <col style={{ width: "80px" }} />
                <col />
                <col style={{ width: "108px" }} />
                <col style={{ width: "40px" }} />
              </colgroup>
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-4 py-4 font-semibold">Product Name</th>
                  <th className="px-2 py-4 font-semibold text-right">Qty</th>
                  <th className="px-2 py-4 font-semibold text-right">Buy</th>
                  <th className="px-2 py-4 font-semibold text-right">Sell</th>
                  <th className="px-4 py-4 font-semibold">Notes</th>
                  <th className="px-2 py-4 font-semibold text-center whitespace-nowrap">
                    Date sold
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.map((sale, idx) => {
                  const globalIdx = (page - 1) * pageSize + idx;
                  return (
                    <tr
                      key={globalIdx}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-2">
                        <Input
                          value={sale.productName}
                          onChange={(e) =>
                            handleSalesChange(
                              globalIdx,
                              "productName",
                              e.target.value,
                            )
                          }
                          className={ci}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={sale.quantitySold}
                          onChange={(e) =>
                            handleSalesChange(
                              globalIdx,
                              "quantitySold",
                              parseInt(e.target.value, 10) || 1,
                            )
                          }
                          onBlur={() => handleSalesBlurQty(globalIdx)}
                          className={`${ci} text-right`}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={sale.buyPrice ?? ""}
                          placeholder="Auto"
                          onChange={(e) =>
                            handleSalesChange(
                              globalIdx,
                              "buyPrice",
                              e.target.value === ""
                                ? undefined
                                : parseFloat(e.target.value),
                            )
                          }
                          onBlur={() =>
                            handleSalesBlurPrice(globalIdx, "buyPrice")
                          }
                          className={`${ci} text-right placeholder:text-muted-foreground/50`}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={sale.salePricePerUnit}
                          onChange={(e) =>
                            handleSalesChange(
                              globalIdx,
                              "salePricePerUnit",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          onBlur={() =>
                            handleSalesBlurPrice(globalIdx, "salePricePerUnit")
                          }
                          className={`${ci} text-right`}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          value={sale.notes || ""}
                          placeholder="Optional"
                          onChange={(e) =>
                            handleSalesChange(
                              globalIdx,
                              "notes",
                              e.target.value,
                            )
                          }
                          className={`${ci} placeholder:text-muted-foreground/50`}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          type="text"
                          value={sale.dateSold || TODAY}
                          onChange={(e) =>
                            handleSalesChange(
                              globalIdx,
                              "dateSold",
                              e.target.value,
                            )
                          }
                          onBlur={() =>
                            handleSalesChange(
                              globalIdx,
                              "dateSold",
                              sanitiseDate(sale.dateSold || TODAY),
                            )
                          }
                          placeholder="DD-MM-YYYY"
                          className={`${ci} min-w-[100px] placeholder:text-muted-foreground/40`}
                        />
                      </td>
                      <td className="py-2 pr-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteSaleRow(globalIdx)}
                          className="cursor-pointer p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          aria-label="Delete row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add row */}
          <div className="px-5 py-2 border-t border-border/50">
            <button
              type="button"
              onClick={handleAddSaleRow}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add row
            </button>
          </div>
        </div>
        {totalPages > 1 && renderPagination(totalPages)}
      </div>
    );
  };

  const renderPagination = (totalPages: number) => (
    <div className="flex items-center justify-center gap-2 pt-2">
      <Button
        variant="outline"
        size="sm"
        disabled={page === 1}
        onClick={() => setPage((p) => Math.max(1, p - 1))}
      >
        Previous
      </Button>
      <span className="text-sm font-medium">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page === totalPages}
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
      >
        Next
      </Button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <PackageSearch className="w-8 h-8 text-primary" />
            AI Import Review
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Please verify the extracted information. You can edit, add, or
            remove rows before confirming.
          </p>
        </div>
      </div>

      <div>
        <div className="flex border-b border-border/50 mb-4 pb-2 select-none">
          <div className="px-4 py-2 font-bold text-lg text-primary border-b-2 border-primary">
            {importData.type === "stock"
              ? "Parsed Stock Lots"
              : "Parsed Sales History"}
          </div>
        </div>

        {importData.type === "stock" &&
          (stockLots.length > 0 ? (
            renderStockTable()
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground py-10 text-center">
                No rows found.
              </p>
              <button
                type="button"
                onClick={handleAddStockRow}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add row
              </button>
            </div>
          ))}
        {importData.type === "sales" &&
          (sales.length > 0 ? (
            renderSalesTable()
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground py-10 text-center">
                No rows found.
              </p>
              <button
                type="button"
                onClick={handleAddSaleRow}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add row
              </button>
            </div>
          ))}
      </div>

      <div className="flex flex-col gap-3 pt-8 border-t border-border mt-10">
        {/* Row 1: Cancel + Try Again */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="h-12 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleTryAgain}
            className="h-12 px-6 border-primary/20 hover:bg-primary/5 shadow-sm cursor-pointer"
          >
            <RefreshCcw className="w-4 h-4 mr-2 text-primary" />
            Try Again
          </Button>
        </div>
        {/* Row 2 (mobile) / inline right (desktop): Confirm & Save */}
        <Button
          onClick={handleConfirm}
          disabled={
            isSaving ||
            (importData.type === "stock"
              ? stockLots.length === 0
              : sales.length === 0)
          }
          className="h-12 w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-white gap-2 font-bold cursor-pointer sm:hidden"
        >
          {isSaving ? "Saving..." : "Confirm & Save"}
          <Save className="w-4 h-4" />
        </Button>
        <div className="hidden sm:flex sm:justify-end">
          <Button
            onClick={handleConfirm}
            disabled={
              isSaving ||
              (importData.type === "stock"
                ? stockLots.length === 0
                : sales.length === 0)
            }
            className="h-12 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-white gap-2 font-bold px-8 cursor-pointer"
          >
            {isSaving ? "Saving..." : "Confirm & Save"}
            <Save className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
