"use client";

import {
  ChevronLeft,
  ChevronRight,
  History,
  LayoutDashboard,
  Package,
  PlusCircle,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import * as React from "react";
import { getPendingInviteCount } from "@/actions/sharing";
import { NavListItem } from "@/components/layout/NavListItem";
import { SidebarProfile } from "@/components/layout/SidebarProfile";
import { AIImportModal } from "@/components/modals/AIImportModal";
import { AddProductModal } from "@/components/modals/addProductModal";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  user: import("@supabase/supabase-js").User;
}

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/stock", icon: Package, label: "Stock Inventory" },
  { href: "/sales", icon: History, label: "Sales History" },
  { href: "/sharing", icon: Users, label: "Sharing" },
];

interface SidebarActionButtonProps {
  label: string;
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  isCollapsed: boolean;
  onClick?: () => void;
}

function SidebarActionButton({
  label,
  title,
  icon: Icon,
  isCollapsed,
  onClick,
}: SidebarActionButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "bg-primary hover:bg-primary-active text-primary-foreground py-2.5 rounded-xl text-button-md flex items-center justify-center transition-all shadow-glow-primary group cursor-pointer",
        isCollapsed ? "md:px-0" : "px-4 gap-2",
      )}
      title={title}
      onClick={onClick}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span
        className={cn(
          "transition-all duration-300 whitespace-nowrap",
          isCollapsed ? "md:opacity-0 md:w-0 overflow-hidden" : "opacity-100",
        )}
      >
        {label}
      </span>
    </button>
  );
}

export function Sidebar({ isOpenMobile, onCloseMobile, user }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [pendingCount, setPendingCount] = React.useState(0);
  const pathname = usePathname();
  const prevPathnameRef = React.useRef<string | null>(null);

  // Re-fetch the badge on mount, on window focus, and on route changes that
  // involve /sharing (where accept/decline happens). Every refresh is a full
  // server-action round trip, so we deliberately skip unrelated navigations.
  React.useEffect(() => {
    const prev = prevPathnameRef.current;
    prevPathnameRef.current = pathname;
    const involvesSharing =
      prev === null ||
      prev.startsWith("/sharing") ||
      pathname.startsWith("/sharing");

    let cancelled = false;
    const refresh = () => {
      getPendingInviteCount()
        .then((count) => {
          if (!cancelled) setPendingCount(count);
        })
        .catch(() => {
          if (!cancelled) setPendingCount(0);
        });
    };

    if (involvesSharing) refresh();
    window.addEventListener("focus", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", refresh);
    };
  }, [pathname]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden cursor-default"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col justify-between border-r border-border bg-background p-4 sm:p-6 transition-all duration-300 ease-in-out md:static",
          // Mobile state
          isOpenMobile
            ? "translate-x-0 w-64"
            : "-translate-x-full md:translate-x-0",
          // Desktop collapsed state (md and up)
          isCollapsed ? "md:w-22" : "md:w-64",
        )}
      >
        <div className="flex flex-col gap-8 h-full">
          {/* Logo */}
          <div className="flex items-center justify-between">
            <div
              className={cn(
                "flex items-center gap-3",
                isCollapsed && "md:justify-center",
              )}
            >
              <Image
                src="/boxistock-logo-ondark.svg"
                alt="boxiStock"
                width={40}
                height={40}
                className="w-10 h-10 min-w-10 shrink-0"
              />
              <h1
                className={cn(
                  "font-display text-display-xs transition-opacity duration-300",
                  isCollapsed
                    ? "md:opacity-0 md:w-0 overflow-hidden"
                    : "opacity-100",
                )}
              >
                BoxiStock
              </h1>
            </div>

            {/* Close button for mobile */}
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close menu"
              className="md:hidden -mr-2 cursor-pointer p-2 text-foreground/70 hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-2 flex-1">
            {navItems.map((item) => (
              <NavListItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isCollapsed={isCollapsed}
                onClick={onCloseMobile}
                badge={item.href === "/sharing" ? pendingCount : undefined}
              />
            ))}
          </nav>

          {/* Bottom actions */}
          <div className="flex flex-col gap-4 mt-auto">
            <AddProductModal>
              {(open) => (
                <SidebarActionButton
                  label="Quick Add"
                  title="Quick Add"
                  icon={PlusCircle}
                  isCollapsed={isCollapsed}
                  onClick={open}
                />
              )}
            </AddProductModal>
            <AIImportModal onAfterGenerate={onCloseMobile}>
              {(open) => (
                <SidebarActionButton
                  label="Add with AI"
                  title="Add with AI"
                  icon={Sparkles}
                  isCollapsed={isCollapsed}
                  onClick={open}
                />
              )}
            </AIImportModal>

            {/* Profile */}
            <SidebarProfile isCollapsed={isCollapsed} user={user} />
          </div>
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden md:flex absolute -right-3 top-20 w-6 h-6 bg-background border border-primary/20 rounded-full items-center justify-center text-foreground hover:border-primary/50 transition-colors z-50 shadow-sm cursor-pointer"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </aside>
    </>
  );
}
