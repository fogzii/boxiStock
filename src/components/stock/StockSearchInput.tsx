"use client";

import { useStockControls } from "@/components/stock/StockControlsContext";
import { UrlSearchInput } from "@/components/ui/UrlSearchInput";

export function StockSearchInput({
  placeholder,
  containerClassName,
}: {
  placeholder?: string;
  containerClassName?: string;
}) {
  const { navigate, isPending } = useStockControls();

  return (
    <UrlSearchInput
      placeholder={placeholder}
      containerClassName={containerClassName}
      onNavigate={navigate}
      isPending={isPending}
    />
  );
}
