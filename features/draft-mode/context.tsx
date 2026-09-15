"use client";

import * as React from "react";

const DraftModeContext = React.createContext<boolean | null>(null);

export function DraftModeProvider({ isDraft, children }: { isDraft: boolean; children: React.ReactNode }) {
  return <DraftModeContext.Provider value={isDraft}>{children}</DraftModeContext.Provider>;
}

export function useDraftMode(): boolean {
  const context = React.useContext(DraftModeContext);

  if (context === null) {
    throw new Error("useDraftMode must be used within a DraftModeProvider");
  }

  return context;
}
