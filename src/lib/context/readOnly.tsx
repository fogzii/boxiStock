"use client";

import * as React from "react";

const ReadOnlyContext = React.createContext({
  readOnly: false,
  hideStockAmounts: false,
});

export function ReadOnlyProvider({
  children,
  hideStockAmounts = false,
}: {
  children: React.ReactNode;
  hideStockAmounts?: boolean;
}) {
  const value = React.useMemo(
    () => ({ readOnly: true, hideStockAmounts }),
    [hideStockAmounts],
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
