"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { StockFilters } from "@/components/stock/StockFilters";
import {
  type ProductWithLots,
  StockTable,
} from "@/components/stock/stockTable";

interface StockPageControlsProps {
  currentSort?: string;
  currentStatus?: string;
  totalStockValue?: number;
  products: ProductWithLots[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export function StockPageControls({
  currentSort,
  currentStatus,
  totalStockValue,
  products,
  currentPage,
  pageSize,
  totalCount,
  totalPages,
}: StockPageControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function handleNavigate(url: string) {
    startTransition(() => {
      router.push(url);
    });
  }

  return (
    <>
      <div className="mb-4">
        <StockFilters
          currentSort={currentSort}
          currentStatus={currentStatus}
          onNavigate={handleNavigate}
          totalStockValue={totalStockValue}
          isPending={isPending}
        />
      </div>
      <div className="pb-8">
        <StockTable
          products={products}
          currentPage={currentPage}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          isExternalPending={isPending}
        />
      </div>
    </>
  );
}
