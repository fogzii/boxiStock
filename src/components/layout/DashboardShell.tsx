"use client";

import type { User } from "@supabase/supabase-js";
import * as React from "react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Footer } from "@/components/layout/Footer";
import {
  NavLoadingProvider,
  useNavLoading,
} from "@/components/layout/NavLoadingContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { FullScreenLoading } from "@/components/ui/fullScreenLoading";
import { PostHogUserIdentifier } from "@/lib/posthog-user";

function DashboardShellInner({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { isLoading } = useNavLoading();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <PostHogUserIdentifier />
      <Sidebar
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        user={user}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden w-full relative">
        {isLoading && <FullScreenLoading contained />}
        <DashboardHeader
          onToggleSidebar={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full flex flex-col">
            <div className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-8 pb-8">
              {children}
            </div>
            <Footer />
          </div>
        </div>
      </main>
    </div>
  );
}

export function DashboardShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User;
}) {
  return (
    <NavLoadingProvider>
      <DashboardShellInner user={user}>{children}</DashboardShellInner>
    </NavLoadingProvider>
  );
}
