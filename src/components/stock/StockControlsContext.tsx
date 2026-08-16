"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

interface StockControlsValue {
  isPending: boolean;
  navigate: (url: string) => void;
}

const StockControlsContext = React.createContext<StockControlsValue | null>(
  null,
);

/**
 * Shares one navigation transition between the filters (which live in the page
 * header's band) and the table (which lives in the body). They sit in separate
 * subtrees, so a plain `useTransition` in a common component isn't available -
 * without this the table would sit static while a filter change round-trips
 * instead of showing its pending skeleton.
 */
export function StockControlsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const value = React.useMemo(
    () => ({
      isPending,
      navigate: (url: string) =>
        startTransition(() => {
          router.push(url, { scroll: false });
        }),
    }),
    [isPending, router],
  );

  return (
    <StockControlsContext.Provider value={value}>
      {children}
    </StockControlsContext.Provider>
  );
}

export function useStockControls() {
  const value = React.useContext(StockControlsContext);
  if (!value) {
    throw new Error(
      "useStockControls must be used within a StockControlsProvider",
    );
  }
  return value;
}
