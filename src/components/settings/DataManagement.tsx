"use client";

import { Button } from "@box-ds";
import {
  AlertTriangle,
  BadgeDollarSign,
  FileDown,
  Loader2,
  PackagePlus,
  Trash2,
} from "lucide-react";
import Papa from "papaparse";
import posthog from "posthog-js";
import { useRef, useState } from "react";
import {
  type CSVExportRow,
  type CSVSalesExportRow,
  deleteAllUserData,
  exportInventoryData,
  exportSalesData,
  importInventoryData,
  importSalesData,
} from "@/actions/settings";

export function DataManagement() {
  const [isExportingInv, setIsExportingInv] = useState(false);
  const [isExportingSales, setIsExportingSales] = useState(false);
  const [isImportingInv, setIsImportingInv] = useState(false);
  const [isImportingSales, setIsImportingSales] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const invInputRef = useRef<HTMLInputElement>(null);
  const salesInputRef = useRef<HTMLInputElement>(null);

  const downloadCSV = <T extends object>(data: T[], filename: string) => {
    if (!data || data.length === 0) return false;
    const csvString = Papa.unparse(data, { header: true });
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  };

  const handleExportInventory = async () => {
    try {
      setIsExportingInv(true);
      setMessage(null);
      const res = await exportInventoryData();
      if (!res.ok) {
        setMessage({ type: "error", text: res.error });
        return;
      }
      const dateStr = new Date().toISOString().split("T")[0];
      const success = downloadCSV(res.data, `inventory_export_${dateStr}.csv`);
      if (!success) {
        setMessage({
          type: "error",
          text: "No inventory data found to export.",
        });
      } else {
        posthog.capture("data_exported", {
          inventory_rows: res.data.length,
          sales_rows: 0,
        });
        setMessage({
          type: "success",
          text: "Inventory exported successfully.",
        });
      }
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to export inventory.",
      });
    } finally {
      setIsExportingInv(false);
    }
  };

  const handleExportSales = async () => {
    try {
      setIsExportingSales(true);
      setMessage(null);
      const res = await exportSalesData();
      if (!res.ok) {
        setMessage({ type: "error", text: res.error });
        return;
      }
      const dateStr = new Date().toISOString().split("T")[0];
      const success = downloadCSV(res.data, `sales_export_${dateStr}.csv`);
      if (!success) {
        setMessage({ type: "error", text: "No sales data found to export." });
      } else {
        posthog.capture("data_exported", {
          inventory_rows: 0,
          sales_rows: res.data.length,
        });
        setMessage({ type: "success", text: "Sales exported successfully." });
      }
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Failed to export sales.",
      });
    } finally {
      setIsExportingSales(false);
    }
  };

  const handleImportInventory = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImportingInv(true);
      setMessage(null);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const rawRows = results.data as Array<Record<string, unknown>>;
            if (
              !rawRows[0]?.productName ||
              rawRows[0]?.quantitySold !== undefined
            ) {
              setMessage({
                type: "error",
                text: "Invalid format. Are you sure this is an Inventory CSV?",
              });
              return;
            }
            const rows = rawRows as unknown as CSVExportRow[];
            const response = await importInventoryData(rows);
            if (!response.ok) {
              setMessage({ type: "error", text: response.error });
              return;
            }
            posthog.capture("inventory_imported", {
              rows_imported: response.count,
            });
            setMessage({
              type: "success",
              text: `Successfully imported ${response.count} inventory items.`,
            });
          } catch (err) {
            setMessage({
              type: "error",
              text:
                err instanceof Error
                  ? err.message
                  : "Failed to process inventory import.",
            });
          } finally {
            setIsImportingInv(false);
            if (invInputRef.current) invInputRef.current.value = "";
          }
        },
        error: () => {
          setMessage({ type: "error", text: "Failed to parse CSV file." });
          setIsImportingInv(false);
          if (invInputRef.current) invInputRef.current.value = "";
        },
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to read file.",
      });
      setIsImportingInv(false);
      if (invInputRef.current) invInputRef.current.value = "";
    }
  };

  const handleImportSales = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImportingSales(true);
      setMessage(null);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const rows = results.data as CSVSalesExportRow[];
            if (!rows[0]?.productName || rows[0]?.quantitySold === undefined) {
              setMessage({
                type: "error",
                text: "Invalid format. Are you sure this is a Sales CSV?",
              });
              return;
            }
            const response = await importSalesData(rows);
            if (!response.ok) {
              setMessage({ type: "error", text: response.error });
              return;
            }
            posthog.capture("sales_imported", {
              rows_imported: response.count,
            });
            setMessage({
              type: "success",
              text: `Successfully imported ${response.count} sales records.`,
            });
          } catch (err) {
            setMessage({
              type: "error",
              text:
                err instanceof Error
                  ? err.message
                  : "Failed to process sales import.",
            });
          } finally {
            setIsImportingSales(false);
            if (salesInputRef.current) salesInputRef.current.value = "";
          }
        },
        error: () => {
          setMessage({ type: "error", text: "Failed to parse CSV file." });
          setIsImportingSales(false);
          if (salesInputRef.current) salesInputRef.current.value = "";
        },
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to read file.",
      });
      setIsImportingSales(false);
      if (salesInputRef.current) salesInputRef.current.value = "";
    }
  };

  const handleDeleteAll = async () => {
    try {
      setIsDeleting(true);
      setMessage(null);
      const res = await deleteAllUserData();
      if (!res.ok) {
        setMessage({ type: "error", text: res.error });
        return;
      }
      posthog.capture("all_data_deleted");
      setMessage({ type: "success", text: "All data successfully deleted." });
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to delete data.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isAnyLoading =
    isExportingInv ||
    isExportingSales ||
    isImportingInv ||
    isImportingSales ||
    isDeleting;

  return (
    <>
      <div className="bg-card w-full rounded-2xl border border-border shadow-sm p-6 flex flex-col h-full relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative z-10 flex flex-col h-full gap-5">
          <div className="flex items-start justify-between gap-4 w-full">
            <div>
              <h2 className="font-display text-display-xs">Data Management</h2>
              <p className="text-muted-foreground text-body-sm mt-1">
                Export your database to retain backups. Upload edited CSV files
                to patch your database.
              </p>
            </div>
            {/* Delete All Data Button Next to Title */}
            <Button
              type="button"
              variant="destructive-outline"
              onClick={() => setIsModalOpen(true)}
              className="shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              Delete All Data
            </Button>
          </div>

          {message && (
            <div
              className={`p-4 rounded-xl text-body-sm ${message.type === "error" ? "bg-negative-surface text-negative border border-negative/20" : "bg-positive-surface text-positive border border-positive/20"}`}
            >
              {message.text}
            </div>
          )}

          {/* Hidden file inputs */}
          <input
            type="file"
            accept=".csv"
            ref={invInputRef}
            onChange={handleImportInventory}
            className="hidden"
            id="import-inv-csv"
          />
          <input
            type="file"
            accept=".csv"
            ref={salesInputRef}
            onChange={handleImportSales}
            className="hidden"
            id="import-sales-csv"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto pt-2">
            {/* Export section */}
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-muted/40 border border-border/50">
              <div>
                <p className="text-body-sm-strong text-foreground">Export</p>
                <p className="text-body-xs text-muted-foreground mt-0.5">
                  Download your data as CSV files for backup or editing.
                </p>
              </div>
              <div className="flex flex-col gap-2 mt-auto">
                <button
                  type="button"
                  onClick={handleExportInventory}
                  disabled={isAnyLoading}
                  className="w-full bg-primary hover:bg-primary-active text-primary-foreground h-10 rounded-xl text-button-sm flex items-center justify-center gap-2 transition-all shadow-glow-primary disabled:opacity-50 cursor-pointer"
                >
                  {isExportingInv ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileDown className="w-4 h-4" />
                  )}
                  Export Inventory
                </button>
                <button
                  type="button"
                  onClick={handleExportSales}
                  disabled={isAnyLoading}
                  className="w-full bg-primary hover:bg-primary-active text-primary-foreground h-10 rounded-xl text-button-sm flex items-center justify-center gap-2 transition-all shadow-glow-primary disabled:opacity-50 cursor-pointer"
                >
                  {isExportingSales ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <BadgeDollarSign className="w-4 h-4" />
                  )}
                  Export Sales
                </button>
              </div>
            </div>

            {/* Import section */}
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-muted/40 border border-border/50">
              <div>
                <p className="text-body-sm-strong text-foreground">Import</p>
                <p className="text-body-xs text-muted-foreground mt-0.5">
                  Upload a CSV file to patch your existing database records.
                </p>
              </div>
              <div className="flex flex-col gap-2 mt-auto">
                <label
                  htmlFor="import-inv-csv"
                  className={`w-full bg-muted hover:bg-muted/80 text-foreground border border-border/50 h-10 rounded-xl text-body-sm-strong flex items-center justify-center gap-2 transition-all cursor-pointer ${isAnyLoading ? "opacity-50 pointer-events-none" : ""}`}
                >
                  {isImportingInv ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <PackagePlus className="w-4 h-4" />
                  )}
                  Import Inventory
                </label>
                <label
                  htmlFor="import-sales-csv"
                  className={`w-full bg-muted hover:bg-muted/80 text-foreground border border-border/50 h-10 rounded-xl text-body-sm-strong flex items-center justify-center gap-2 transition-all cursor-pointer ${isAnyLoading ? "opacity-50 pointer-events-none" : ""}`}
                >
                  {isImportingSales ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <BadgeDollarSign className="w-4 h-4" />
                  )}
                  Import Sales
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md p-6 rounded-2xl border border-border shadow-xl">
            <div className="flex items-center gap-3 text-destructive mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="font-display text-display-xs">Wipe Database?</h2>
            </div>

            <p className="text-muted-foreground mb-6">
              This action represents a destructive operation. All of your{" "}
              <strong className="text-foreground">
                inventory products, lots, and sales history
              </strong>{" "}
              will be permanently deleted. This cannot be undone. Are you sure
              you want to proceed?
            </p>

            <div className="flex gap-4 w-full">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
                disabled={isDeleting}
                className="flex-1"
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteAll}
                disabled={isDeleting}
                className="flex-1 shadow-glow-subtle"
              >
                {isDeleting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Yes, Delete It All"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
