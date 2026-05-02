"use client";

import * as React from "react";

const ReadOnlyContext = React.createContext(false);

export function ReadOnlyProvider({ children }: { children: React.ReactNode }) {
  return (
    <ReadOnlyContext.Provider value={true}>{children}</ReadOnlyContext.Provider>
  );
}

export function useReadOnly() {
  return React.useContext(ReadOnlyContext);
}
