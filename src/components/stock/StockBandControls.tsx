"use client";

import { AddStockButton } from "@/components/modals/addProductModal";
import { BundleSaleButton } from "@/components/modals/bundleSaleModal";
import { useStockControls } from "@/components/stock/StockControlsContext";
import { StockFilters } from "@/components/stock/StockFilters";

/**
 * The stock header band's right-hand column: add-stock and bundle-sale
 * actions with the sort and status filters stacked beneath them.
 */
export function StockBandControls({
  currentSort,
  currentStatus,
}: {
  currentSort?: string;
  currentStatus?: string;
}) {
  const { isPending, navigate } = useStockControls();

  return (
    <div className="flex w-full flex-col items-end gap-3 @min-[700px]:w-auto">
      <div className="flex flex-wrap justify-end gap-2">
        <BundleSaleButton />
        <AddStockButton />
      </div>
      <StockFilters
        currentSort={currentSort}
        currentStatus={currentStatus}
        onNavigate={navigate}
        isPending={isPending}
      />
    </div>
  );
}
