"use client";

import { createContext, useContext } from "react";

interface SidebarContextValue {
  toggleMobile: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export const SidebarProvider = SidebarContext.Provider;

export function useSidebar() {
  const value = useContext(SidebarContext);
  if (!value) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return value;
}
