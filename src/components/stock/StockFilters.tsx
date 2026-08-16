"use client";

import { SegmentedControl } from "@box-ds";
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
  isPending?: boolean;
  sortParamKey?: string;
  statusParamKey?: string;
  pageParamKey?: string;
  showValueSort?: boolean;
}

export function StockFilters({
  currentSort,
  currentStatus,
  onNavigate,
  isPending = false,
  sortParamKey = "sort",
  statusParamKey = "status",
  pageParamKey = "page",
  showValueSort = true,
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

  const sortOptions = showValueSort
    ? SORT_OPTIONS
    : SORT_OPTIONS.filter(
        (o) => o.value !== "value_asc" && o.value !== "value_desc",
      );

  const activeSort = currentSort ?? "";
  // Resolved against the options rather than taken raw, so the param types the
  // tab value and an unknown `?status=` falls back to All.
  const activeStatus =
    STATUS_OPTIONS.find((o) => o.value === currentStatus)?.value ?? "all";
  const activeSortLabel =
    sortOptions.find((o) => o.value === activeSort)?.label ?? "Recent first";

  // The tab fills in on click rather than when the navigation lands: the URL
  // is the source of truth, but waiting on the round trip left the pill on the
  // old status while the table was already showing its skeleton. The effect
  // re-syncs once `activeStatus` catches up, which also covers back/forward.
  const [selectedStatus, setSelectedStatus] = React.useState(activeStatus);
  React.useEffect(() => {
    setSelectedStatus(activeStatus);
  }, [activeStatus]);

  function pushParams(
    updates: Record<string, string | undefined>,
    key: string,
  ) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(pageParamKey);
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
      router.push(url, { scroll: false });
    }
  }

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
    <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
      <div
        ref={dropdownRef}
        className="relative w-full min-w-0 sm:w-auto sm:min-w-[190px] sm:flex-none"
      >
        <button
          type="button"
          onClick={() => setSortOpen((o) => !o)}
          className="flex h-10 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-lg border border-primary/20 bg-background/50 pl-3 pr-2.5 text-body-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-ring/50 sm:min-w-[190px]"
        >
          <span className="flex min-w-0 items-center gap-2">
            <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{activeSortLabel}</span>
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-150",
              sortOpen && "rotate-180",
            )}
          />
        </button>

        {sortOpen && (
          <div className="absolute top-full left-0 z-50 mt-1 w-full min-w-[190px] overflow-hidden rounded-lg border border-primary/20 bg-card shadow-lg shadow-black/20 animate-in fade-in slide-in-from-top-1 duration-100">
            {sortOptions.map((opt) => {
              const isSelected = activeSort === opt.value;
              const isThisPending =
                isPending && pendingKey === `sort-${opt.value}`;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    pushParams(
                      { [sortParamKey]: opt.value },
                      `sort-${opt.value}`,
                    );
                    setSortOpen(false);
                  }}
                  disabled={isPending}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between px-3 py-2 text-body-sm transition-colors disabled:pointer-events-none disabled:cursor-not-allowed",
                    isSelected
                      ? "bg-primary/10 text-body-sm-strong text-primary"
                      : "text-foreground hover:bg-primary/5 hover:text-primary",
                  )}
                >
                  {opt.label}
                  {isThisPending ? (
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                  ) : (
                    isSelected && <Check className="h-3.5 w-3.5 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <SegmentedControl
        className="w-full min-w-0 sm:w-auto sm:flex-none"
        ariaLabel="Stock status"
        items={STATUS_OPTIONS}
        value={selectedStatus}
        onChange={(next) => {
          setSelectedStatus(next);
          pushParams({ [statusParamKey]: next }, `status-${next}`);
        }}
      />
    </div>
  );
}
