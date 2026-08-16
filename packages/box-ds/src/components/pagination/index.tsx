"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../utils/cn";
import { Button } from "../button";

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  unitLabel: string;
  isPending?: boolean;
  onPageChange: (page: number) => void;
  className?: string;
}

function Pagination({
  currentPage,
  pageSize,
  totalCount,
  totalPages,
  unitLabel,
  isPending = false,
  onPageChange,
  className,
}: PaginationProps) {
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isPending}
        >
          <ChevronLeft /> Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isPending}
        >
          Next <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

export type { PaginationProps };
export { Pagination };
