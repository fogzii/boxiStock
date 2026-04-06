"use client";

import { useState, useRef } from "react";
import {
  exportInventoryData,
  exportSalesData,
  importInventoryData,
  importSalesData,
  deleteAllUserData,
  CSVExportRow,
  CSVSalesExportRow
} from "@/actions/settings";
import Papa from "papaparse";
import { Loader2, FileDown, PackagePlus, BadgeDollarSign, Trash2, AlertTriangle } from "lucide-react";

export function DataManagement() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImportingInv, setIsImportingInv] = useState(false);
  const [isImportingSales, setIsImportingSales] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const invInputRef = useRef<HTMLInputElement>(null);
  const salesInputRef = useRef<HTMLInputElement>(null);

  const downloadCSV = (data: any[], filename: string) => {
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

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setMessage(null);

      const invData = await exportInventoryData();
      const salesData = await exportSalesData();

      const dateStr = new Date().toISOString().split("T")[0];
      const invSuccess = downloadCSV(invData, `inventory_export_${dateStr}.csv`);
      const salesSuccess = downloadCSV(salesData, `sales_export_${dateStr}.csv`);

      if (!invSuccess && !salesSuccess) {
        setMessage({ type: "error", text: "No data found to export in either Inventory or Sales." });
      } else {
        setMessage({ type: "success", text: "Export completed successfully. (Check your downloads for multiple files if both contained data)" });
      }
    } catch (error: any) {
      console.error(error);
      setMessage({ type: "error", text: error.message || "Failed to export data." });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportInventory = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
            const rows = results.data as CSVExportRow[];
            if (!rows[0]?.productName || rows[0]?.quantitySold !== undefined) {
              setMessage({ type: "error", text: "Invalid format. Are you sure this is an Inventory CSV?" });
              return;
            }
            const response = await importInventoryData(rows);
            setMessage({ type: "success", text: `Successfully imported ${response.count} inventory items.` });
          } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Failed to process inventory import." });
          } finally {
            setIsImportingInv(false);
            if (invInputRef.current) invInputRef.current.value = "";
          }
        },
        error: () => {
          setMessage({ type: "error", text: "Failed to parse CSV file." });
          setIsImportingInv(false);
          if (invInputRef.current) invInputRef.current.value = "";
        }
      });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to read file." });
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
              setMessage({ type: "error", text: "Invalid format. Are you sure this is a Sales CSV?" });
              return;
            }
            const response = await importSalesData(rows);
            setMessage({ type: "success", text: `Successfully imported ${response.count} sales records.` });
          } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Failed to process sales import." });
          } finally {
            setIsImportingSales(false);
            if (salesInputRef.current) salesInputRef.current.value = "";
          }
        },
        error: () => {
          setMessage({ type: "error", text: "Failed to parse CSV file." });
          setIsImportingSales(false);
          if (salesInputRef.current) salesInputRef.current.value = "";
        }
      });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to read file." });
      setIsImportingSales(false);
      if (salesInputRef.current) salesInputRef.current.value = "";
    }
  };

  const handleDeleteAll = async () => {
    try {
      setIsDeleting(true);
      setMessage(null);
      await deleteAllUserData();
      setMessage({ type: "success", text: "All data successfully deleted." });
      setIsModalOpen(false);
    } catch (error: any) {
      console.error(error);
      setMessage({ type: "error", text: error.message || "Failed to delete data." });
    } finally {
      setIsDeleting(false);
    }
  };

  const isAnyLoading = isExporting || isImportingInv || isImportingSales || isDeleting;

  return (
    <>
      <div className="bg-card w-full rounded-2xl border border-border shadow-sm p-6 flex flex-col h-full relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative z-10 flex flex-col h-full gap-5">
          <div className="flex items-start justify-between gap-4 w-full">
            <div>
              <h2 className="text-xl font-bold">Data Management</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Export your database to retain backups. Upload edited CSV files to patch your database.
              </p>
            </div>
            {/* Delete All Data Button Next to Title */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors shrink-0 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Delete All Data
            </button>
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-sm ${message.type === "error" ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"}`}>
              {message.text}
            </div>
          )}

          <div className="flex flex-col gap-4 mt-auto pt-2">
            {/* Main Export */}
            <button
              onClick={handleExport}
              disabled={isAnyLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_20px_-5px_rgba(145,128,168,0.4)] hover:shadow-[0_10px_40px_-10px_rgba(145,128,168,0.6)] disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
              Export All Data
            </button>

            {/* Inputs */}
            <input type="file" accept=".csv" ref={invInputRef} onChange={handleImportInventory} className="hidden" id="import-inv-csv" />
            <input type="file" accept=".csv" ref={salesInputRef} onChange={handleImportSales} className="hidden" id="import-sales-csv" />

            {/* Import Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <label
                htmlFor="import-inv-csv"
                className={`flex-1 bg-muted hover:bg-muted/80 text-foreground border border-border/50 h-11 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${isAnyLoading ? "opacity-50 pointer-events-none" : ""}`}
              >
                {isImportingInv ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackagePlus className="w-4 h-4" />}
                Import Inventory
              </label>

              <label
                htmlFor="import-sales-csv"
                className={`flex-1 bg-muted hover:bg-muted/80 text-foreground border border-border/50 h-11 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${isAnyLoading ? "opacity-50 pointer-events-none" : ""}`}
              >
                {isImportingSales ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeDollarSign className="w-4 h-4" />}
                Import Sales
              </label>
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
              <h2 className="text-xl font-bold">Wipe Database?</h2>
            </div>

            <p className="text-muted-foreground mb-6">
              This action represents a destructive operation. All of your <strong className="text-foreground">inventory products, lots, and sales history</strong> will be permanently deleted. This cannot be undone. Are you sure you want to proceed?
            </p>

            <div className="flex gap-4 w-full">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold bg-muted hover:bg-muted/80 text-foreground transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteAll}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-all shadow-[0_0_20px_-5px_rgba(239,68,68,0.4)] disabled:opacity-50 flex items-center justify-center cursor-pointer"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Yes, Delete It All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
