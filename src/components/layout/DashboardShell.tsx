"use client";

import type { User } from "@supabase/supabase-js";
import * as React from "react";
import { Footer } from "@/components/layout/Footer";
import {
  NavLoadingProvider,
  useNavLoading,
} from "@/components/layout/NavLoadingContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/components/layout/SidebarContext";
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

  const sidebarValue = React.useMemo(
    () => ({ toggleMobile: () => setIsMobileMenuOpen((open) => !open) }),
    [],
  );

  return (
    <SidebarProvider value={sidebarValue}>
      <div className="flex h-screen overflow-hidden bg-background">
        <PostHogUserIdentifier />
        <Sidebar
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          user={user}
        />

        {/* Main Content Area. Each page renders its own <PageHeader />, so the
            header scrolls with the content and can carry page-specific stats. */}
        <main className="relative flex w-full min-w-0 flex-1 flex-col overflow-hidden">
          {isLoading && <FullScreenLoading contained />}

          {/* Scrollable Page Content */}
          <div className="min-w-0 flex-1 overflow-y-auto">
            <div className="flex min-h-full min-w-0 flex-col">
              <div className="w-full min-w-0 flex-1">{children}</div>
              <Footer />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
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
