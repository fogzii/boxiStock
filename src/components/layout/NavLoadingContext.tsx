"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

interface NavLoadingContextValue {
  isLoading: boolean;
  startLoading: () => void;
}

const NavLoadingContext = createContext<NavLoadingContextValue | null>(null);

export function NavLoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname change is the trigger
  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  return (
    <NavLoadingContext.Provider
      value={{ isLoading, startLoading: () => setIsLoading(true) }}
    >
      {children}
    </NavLoadingContext.Provider>
  );
}

export function useNavLoading() {
  const value = useContext(NavLoadingContext);
  if (!value) {
    throw new Error("useNavLoading must be used within a NavLoadingProvider");
  }
  return value;
}
