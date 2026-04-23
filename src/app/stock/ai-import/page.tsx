"use client";

import { ArrowLeft, PackageSearch, RefreshCcw, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { bulkAddLotsAndProducts, bulkAddSales } from "@/actions/stock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAIImport } from "@/context/AIImportContext";

export default function AIImportReviewPage() {
  const { importData, setImportData } = useAIImport();
  const router = useRouter();
  const [stockLots, setStockLots] = useState(importData?.stockLots || []);
  const [sales, setSales] = useState(importData?.sales || []);
  const [isSaving, setIsSaving] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!importData) {
      router.push("/stock");
    } else {
      setStockLots(importData.stockLots || []);
      setSales(importData.sales || []);
    }
  }, [importData, router]);

  if (!importData) return null;

  const handleStockChange = (index: number, field: string, value: unknown) => {
    const updated = [...stockLots];
    updated[index] = { ...updated[index], [field]: value };
    setStockLots(updated);
  };

  const handleSalesChange = (index: number, field: string, value: unknown) => {
    const updated = [...sales];
    updated[index] = { ...updated[index], [field]: value };
    setSales(updated);
  };

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      if (importData.type === "stock") {
        await bulkAddLotsAndProducts(stockLots);
        toast.success("Stock lots added successfully!");
      } else {
        await bulkAddSales(sales);
        toast.success("Sales added successfully!");
      }
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
    setImportData(null);
    router.push("/stock");
  };

  const handleTryAgain = () => {
    router.push("/stock?openAi=true"); // Not exactly needed. We can just push to /stock and tell user to trigger modal again. Wait, the requirement: 'open text modal so they can adjust their prompt'. We should just router.back() and maybe set a query param to open.
    // simpler:
    router.push("/stock?reopen-ai=true");
  };

  // Rendering Tables
  const renderStockTable = () => {
    const totalPages = Math.ceil(stockLots.length / pageSize);
    const paginated = stockLots.slice((page - 1) * pageSize, page * pageSize);

    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-5 py-4 font-semibold w-[30%]">
                    Product Name
                  </th>
                  <th className="px-5 py-4 font-semibold w-[15%] text-right">
                    Quantity
                  </th>
                  <th className="px-5 py-4 font-semibold w-[15%] text-right">
                    Buy Price ($)
                  </th>
                  <th className="px-5 py-4 font-semibold w-[20%]">
                    Lot Identity
                  </th>
                  <th className="px-5 py-4 font-semibold w-[20%] text-center">
                    Received Date
                  </th>
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
                      <td className="px-5 py-3">
                        <Input
                          value={item.name}
                          onChange={(e) =>
                            handleStockChange(globalIdx, "name", e.target.value)
                          }
                          className="h-9 px-2 bg-transparent border-transparent hover:border-primary/20 focus:bg-background"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <Input
                          type="number"
                          value={item.initialQuantity}
                          onChange={(e) =>
                            handleStockChange(
                              globalIdx,
                              "initialQuantity",
                              parseInt(e.target.value, 10) || 0,
                            )
                          }
                          className="h-9 px-2 text-right bg-transparent border-transparent hover:border-primary/20 focus:bg-background"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.buyPrice}
                          onChange={(e) =>
                            handleStockChange(
                              globalIdx,
                              "buyPrice",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="h-9 px-2 text-right bg-transparent border-transparent hover:border-primary/20 focus:bg-background"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <Input
                          value={item.lotIdentity || ""}
                          placeholder="Optional"
                          onChange={(e) =>
                            handleStockChange(
                              globalIdx,
                              "lotIdentity",
                              e.target.value,
                            )
                          }
                          className="h-9 px-2 bg-transparent border-transparent hover:border-primary/20 focus:bg-background placeholder:text-muted-foreground/50"
                        />
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Input
                          type="date"
                          value={item.dateAcquired || ""}
                          onChange={(e) =>
                            handleStockChange(
                              globalIdx,
                              "dateAcquired",
                              e.target.value,
                            )
                          }
                          className="h-9 px-2 text-center bg-transparent border-transparent hover:border-primary/20 focus:bg-background"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {totalPages > 1 && renderPagination(totalPages)}
      </div>
    );
  };

  const renderSalesTable = () => {
    const totalPages = Math.ceil(sales.length / pageSize);
    const paginated = sales.slice((page - 1) * pageSize, page * pageSize);

    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-5 py-4 font-semibold">Product Name</th>
                  <th className="px-5 py-4 font-semibold text-right">
                    Sold Qty
                  </th>
                  <th className="px-5 py-4 font-semibold text-right">
                    Buy Price ($)
                  </th>
                  <th className="px-5 py-4 font-semibold text-right">
                    Sale Price ($)
                  </th>
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
                      <td className="px-5 py-3">
                        <Input
                          value={sale.productName}
                          onChange={(e) =>
                            handleSalesChange(
                              globalIdx,
                              "productName",
                              e.target.value,
                            )
                          }
                          className="h-9 px-2 bg-transparent border-transparent hover:border-primary/20 focus:bg-background"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <Input
                          type="number"
                          value={sale.quantitySold}
                          onChange={(e) =>
                            handleSalesChange(
                              globalIdx,
                              "quantitySold",
                              parseInt(e.target.value, 10),
                            )
                          }
                          className="h-9 px-2 text-right bg-transparent border-transparent hover:border-primary/20 focus:bg-background"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <Input
                          type="number"
                          step="0.01"
                          value={sale.buyPrice || ""}
                          placeholder="Auto (from stock)"
                          onChange={(e) =>
                            handleSalesChange(
                              globalIdx,
                              "buyPrice",
                              parseFloat(e.target.value),
                            )
                          }
                          className="h-9 px-2 text-right bg-transparent border-transparent hover:border-primary/20 focus:bg-background placeholder:text-muted-foreground/50"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <Input
                          type="number"
                          step="0.01"
                          value={sale.salePricePerUnit}
                          onChange={(e) =>
                            handleSalesChange(
                              globalIdx,
                              "salePricePerUnit",
                              parseFloat(e.target.value),
                            )
                          }
                          className="h-9 px-2 text-right bg-transparent border-transparent hover:border-primary/20 focus:bg-background"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
            Please verify the extracted information. You can edit any details
            directly in the table before confirming.
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
            <p className="text-muted-foreground py-10 text-center">
              No structural info found.
            </p>
          ))}
        {importData.type === "sales" &&
          (sales.length > 0 ? (
            renderSalesTable()
          ) : (
            <p className="text-muted-foreground py-10 text-center">
              No structural info found.
            </p>
          ))}
      </div>

      <div className="flex justify-between items-center pt-8 border-t border-border mt-10">
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={handleTryAgain}
            className="border-primary/20 hover:bg-primary/5 shadow-sm cursor-pointer"
          >
            <RefreshCcw className="w-4 h-4 mr-2 text-primary" />
            Try Again
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              isSaving ||
              (importData.type === "stock"
                ? stockLots.length === 0
                : sales.length === 0)
            }
            className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-white gap-2 font-bold px-8 cursor-pointer"
          >
            {isSaving ? "Saving..." : "Confirm & Save"}
            <Save className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
