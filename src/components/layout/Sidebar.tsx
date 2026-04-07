"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  History,
  Settings,
  PlusCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { SidebarProfile } from "@/components/layout/SidebarProfile";
import { NavListItem } from "@/components/layout/NavListItem";
import { usePathname } from "next/navigation";
import { AddProductModal } from "@/components/stock/addProductModal";
import { AIImportModal } from "@/components/stock/AIImportModal";

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/stock", icon: Package, label: "Stock Manager" },
  { href: "/sales", icon: History, label: "Sales History" },
  { href: "/settings", icon: Settings, label: "Settings" },
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
      className={cn(
        "bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl font-bold flex items-center justify-center transition-all shadow-[0_0_20px_-5px_rgba(145,128,168,0.4)] hover:shadow-[0_10px_40px_-10px_rgba(145,128,168,0.6)] group cursor-pointer",
        isCollapsed ? "md:px-0" : "px-4 gap-2",
      )}
      title={title}
      onClick={onClick}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span
        className={cn(
          "transition-all duration-300 whitespace-nowrap",
          isCollapsed
            ? "md:opacity-0 md:w-0 overflow-hidden"
            : "opacity-100",
        )}
      >
        {label}
      </span>
    </button>
  );
}

export function Sidebar({ isOpenMobile, onCloseMobile }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const pathname = usePathname();
  const showQuickAdd = pathname === "/dashboard";

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
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
              <div className="w-10 h-10 min-w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                <Package className="w-6 h-6" />
              </div>
              <h1
                className={cn(
                  "text-xl font-extrabold tracking-tight transition-opacity duration-300",
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
              onClick={onCloseMobile}
              className="md:hidden p-2 -mr-2 text-foreground/70 hover:text-foreground"
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
              />
            ))}
          </nav>

          {/* Bottom actions */}
          <div className="flex flex-col gap-4 mt-auto">
            {/* Quick Add Button – only on Dashboard */}
            {showQuickAdd && (
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
            )}

            {/* Add Product Button – only on Stock page */}
            {pathname === "/stock" && (
              <>
                <AddProductModal>
                  {(open) => (
                    <SidebarActionButton
                      label="Add Product"
                      title="Add Product"
                      icon={PlusCircle}
                      isCollapsed={isCollapsed}
                      onClick={open}
                    />
                  )}
                </AddProductModal>
                <AIImportModal>
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
              </>
            )}

            {/* Profile */}
            <SidebarProfile isCollapsed={isCollapsed} />
          </div>
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-20 w-6 h-6 bg-background border border-primary/20 rounded-full items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors z-50 shadow-sm"
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
