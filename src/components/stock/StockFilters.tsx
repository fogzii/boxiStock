"use client";

import { ArrowUpDown, Check, ChevronDown, Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "", label: "Recent first" },
  { value: "name_asc", label: "Name A → Z" },
  { value: "name_desc", label: "Name Z → A" },
  { value: "stock_asc", label: "Stock: Low → High" },
  { value: "stock_desc", label: "Stock: High → Low" },
  { value: "value_asc", label: "Value: Low → High" },
  { value: "value_desc", label: "Value: High → Low" },
] as const;

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "stocked", label: "In Stock" },
  { value: "pending", label: "Pending" },
] as const;

interface StockFiltersProps {
  currentSort?: string;
  currentStatus?: string;
  onNavigate?: (url: string) => void;
  totalStockValue?: number;
  isPending?: boolean;
}

export function StockFilters({
  currentSort,
  currentStatus,
  onNavigate,
  totalStockValue,
  isPending = false,
}: StockFiltersProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [sortOpen, setSortOpen] = React.useState(false);
  const [pendingKey, setPendingKey] = React.useState<string | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isPending) setPendingKey(null);
  }, [isPending]);

  const activeSort = currentSort ?? "";
  const activeStatus = currentStatus ?? "all";
  const activeSortLabel =
    SORT_OPTIONS.find((o) => o.value === activeSort)?.label ?? "Recent first";

  function pushParams(
    updates: Record<string, string | undefined>,
    key: string,
  ) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    for (const [k, val] of Object.entries(updates)) {
      if (!val || val === "" || val === "all") {
        params.delete(k);
      } else {
        params.set(k, val);
      }
    }
    setPendingKey(key);
    const url = `${pathname}?${params.toString()}`;
    if (onNavigate) {
      onNavigate(url);
    } else {
      router.push(url);
    }
  }

  // Close dropdown on outside click
  React.useEffect(() => {
    if (!sortOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [sortOpen]);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Total stock value */}
      {totalStockValue !== undefined && (
        <div className="flex items-center gap-1.5 text-body-sm mr-auto">
          <span className="text-muted-foreground">Total Stock Value:</span>
          <span className="text-body-sm-strong text-foreground">
            $
            {totalStockValue.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      )}

      {/* Sort custom dropdown */}
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setSortOpen((o) => !o)}
          className="flex items-center gap-2 h-9 pl-3 pr-2.5 text-body-sm rounded-lg border border-primary/20 bg-background/50 text-foreground hover:bg-primary/5 hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors min-w-[190px] justify-between"
        >
          <span className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span>{activeSortLabel}</span>
          </span>
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 text-muted-foreground transition-transform duration-150 shrink-0",
              sortOpen && "rotate-180",
            )}
          />
        </button>

        {sortOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 w-full min-w-[190px] rounded-lg border border-primary/20 bg-card shadow-lg shadow-black/20 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100">
            {SORT_OPTIONS.map((opt) => {
              const isSelected = activeSort === opt.value;
              const isThisPending =
                isPending && pendingKey === `sort-${opt.value}`;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    pushParams({ sort: opt.value }, `sort-${opt.value}`);
                    setSortOpen(false);
                  }}
                  disabled={isPending}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-body-sm transition-colors",
                    isSelected
                      ? "bg-primary/10 text-primary text-body-sm-strong"
                      : "text-foreground hover:bg-primary/5 hover:text-primary",
                  )}
                >
                  {opt.label}
                  {isThisPending ? (
                    <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                  ) : (
                    isSelected && <Check className="w-3.5 h-3.5 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Status pills */}
      <div className="flex items-center border border-primary/20 rounded-lg overflow-hidden bg-background/50">
        {STATUS_OPTIONS.map((opt) => {
          const isActive = activeStatus === opt.value;
          const isThisPending =
            isPending && pendingKey === `status-${opt.value}`;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                pushParams({ status: opt.value }, `status-${opt.value}`)
              }
              disabled={isPending}
              className={cn(
                "px-3 h-9 text-body-sm-strong transition-colors inline-flex items-center gap-1.5",
                isActive
                  ? opt.value === "stocked"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : opt.value === "pending"
                      ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400"
                      : "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-primary/5 hover:text-foreground",
                "border-r border-primary/20 last:border-r-0",
              )}
            >
              {isThisPending && (
                <Loader2 className="w-3 h-3 animate-spin shrink-0" />
              )}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
