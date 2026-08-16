"use client";

import { useStockControls } from "@/components/stock/StockControlsContext";
import {
  type ProductWithLots,
  StockTable,
} from "@/components/stock/stockTable";

interface StockPageControlsProps {
  products: ProductWithLots[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  tableClassName?: string;
}

export function StockPageControls({
  products,
  currentPage,
  pageSize,
  totalCount,
  totalPages,
  tableClassName,
}: StockPageControlsProps) {
  const { isPending, navigate } = useStockControls();

  return (
    <StockTable
      className={tableClassName}
      products={products}
      currentPage={currentPage}
      pageSize={pageSize}
      totalCount={totalCount}
      totalPages={totalPages}
      isExternalPending={isPending}
      onPageChange={(page) => {
        const params = new URLSearchParams(window.location.search);
        params.set("page", String(page));
        navigate(`/stock?${params.toString()}`);
      }}
    />
  );
}
