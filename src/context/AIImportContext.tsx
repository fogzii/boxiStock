"use client";

import React, { createContext, useContext, useState } from "react";

export type ImportType = "stock" | "sales";

interface ParsedStockLot {
  name: string;
  initialQuantity: number;
  buyPrice: number;
  isStocked: boolean;
  lotIdentity?: string;
  dateAcquired?: string;
}

interface ParsedSale {
  productName: string;
  quantitySold: number;
  salePricePerUnit: number;
  buyPrice?: number;
}

interface AIImportData {
  type: ImportType;
  prompt: string;
  stockLots: ParsedStockLot[];
  sales: ParsedSale[];
}

interface AIImportContextType {
  importData: AIImportData | null;
  setImportData: (data: AIImportData | null) => void;
}

const AIImportContext = createContext<AIImportContextType | undefined>(undefined);

export function AIImportProvider({ children }: { children: React.ReactNode }) {
  const [importData, setImportData] = useState<AIImportData | null>(null);

  return (
    <AIImportContext.Provider value={{ importData, setImportData }}>
      {children}
    </AIImportContext.Provider>
  );
}

export function useAIImport() {
  const context = useContext(AIImportContext);
  if (context === undefined) {
    throw new Error("useAIImport must be used within an AIImportProvider");
  }
  return context;
}
