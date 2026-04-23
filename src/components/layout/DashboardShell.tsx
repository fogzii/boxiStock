"use client";

import * as React from "react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Sidebar } from "@/components/layout/Sidebar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Close sidebar when clicking a link on mobile (handled by route change normally, but good to ensure)
  // In a real app we might use usePathname effect to auto-close

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar handles both mobile drawer and desktop collapse internally */}
      <Sidebar
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden w-full relative">
        <DashboardHeader
          onToggleSidebar={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
