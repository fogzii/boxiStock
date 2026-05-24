"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TablePaginationProps {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  unitLabel: string;
  isPending?: boolean;
  onPageChange: (page: number) => void;
  className?: string;
  scrollKey?: string;
}

export function TablePagination({
  currentPage,
  pageSize,
  totalCount,
  totalPages,
  unitLabel,
  isPending = false,
  onPageChange,
  className,
  scrollKey,
}: TablePaginationProps) {
  function saveScroll() {
    if (scrollKey) {
      sessionStorage.setItem(`scroll-${scrollKey}`, String(window.scrollY));
    }
  }
  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalCount);

  return (
    <div
      className={cn("flex flex-row items-center justify-between", className)}
    >
      <div className="text-body-sm text-muted-foreground">
        <span className="sm:hidden">
          <span className="text-body-sm-strong text-foreground">{from}</span>-
          <span className="text-body-sm-strong text-foreground">{to}</span> of{" "}
          <span className="text-body-sm-strong text-foreground">
            {totalCount}
          </span>{" "}
          {unitLabel}
        </span>
        <span className="hidden sm:inline">
          Showing{" "}
          <span className="text-body-sm-strong text-foreground">{from}</span> to{" "}
          <span className="text-body-sm-strong text-foreground">{to}</span> of{" "}
          <span className="text-body-sm-strong text-foreground">
            {totalCount}
          </span>{" "}
          {unitLabel}
        </span>
      </div>
      <div className="flex flex-row gap-2">
        <button
          type="button"
          onClick={() => {
            saveScroll();
            onPageChange(currentPage - 1);
          }}
          disabled={currentPage <= 1 || isPending}
          className="inline-flex items-center justify-center h-8 px-3 text-body-sm-strong rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Previous
        </button>
        <button
          type="button"
          onClick={() => {
            saveScroll();
            onPageChange(currentPage + 1);
          }}
          disabled={currentPage >= totalPages || isPending}
          className="inline-flex items-center justify-center h-8 px-3 text-body-sm-strong rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          Next <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
}
