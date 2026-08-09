"use client";

import * as React from "react";

const ReadOnlyContext = React.createContext({
  readOnly: false,
  hideStockAmounts: false,
  hideSellPrice: false,
  hideProjectedProfit: false,
});

export function ReadOnlyProvider({
  children,
  hideStockAmounts = false,
  hideSellPrice = false,
  hideProjectedProfit = false,
}: {
  children: React.ReactNode;
  hideStockAmounts?: boolean;
  hideSellPrice?: boolean;
  hideProjectedProfit?: boolean;
}) {
  const value = React.useMemo(
    () => ({
      readOnly: true,
      hideStockAmounts,
      hideSellPrice,
      hideProjectedProfit,
    }),
    [hideStockAmounts, hideSellPrice, hideProjectedProfit],
  );
  return (
    <ReadOnlyContext.Provider value={value}>
      {children}
    </ReadOnlyContext.Provider>
  );
}

export function useReadOnly() {
  return React.useContext(ReadOnlyContext).readOnly;
}

export function useHideStockAmounts() {
  return React.useContext(ReadOnlyContext).hideStockAmounts;
}

export function useHideSellPrice() {
  return React.useContext(ReadOnlyContext).hideSellPrice;
}

export function useHideProjectedProfit() {
  return React.useContext(ReadOnlyContext).hideProjectedProfit;
}
