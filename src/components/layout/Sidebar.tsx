"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

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

export function Sidebar({ isOpenMobile, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

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
          // Desktop collapsed state
          isCollapsed ? "xl:w-22" : "xl:w-64",
        )}
      >
        <div className="flex flex-col gap-8 h-full">
          <div className="flex items-center justify-between">
            <div
              className={cn(
                "flex items-center gap-3",
                isCollapsed && "xl:justify-center",
              )}
            >
              <div className="w-10 h-10 min-w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                <Package className="w-6 h-6" />
              </div>
              <h1
                className={cn(
                  "text-xl font-extrabold tracking-tight transition-opacity duration-300",
                  isCollapsed
                    ? "xl:opacity-0 xl:w-0 overflow-hidden"
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

          <nav className="flex flex-col gap-2 flex-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center py-2.5 rounded-lg transition-colors group relative",
                    isCollapsed ? "px-4 xl:px-0 xl:justify-center" : "gap-3 px-4",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-primary/5 hover:text-foreground",
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span
                    className={cn(
                      "font-semibold text-sm whitespace-nowrap transition-all duration-300",
                      isCollapsed
                        ? "xl:opacity-0 xl:w-0 overflow-hidden"
                        : "opacity-100",
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-col gap-6 mt-auto">
            {/* Quick Add Button */}
            <button
              className={cn(
                "bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_-5px_rgba(145,128,168,0.4)] hover:shadow-[0_10px_40px_-10px_rgba(145,128,168,0.6)] group",
                isCollapsed ? "xl:px-0" : "px-4",
              )}
              title="Quick Add"
            >
              <PlusCircle className="w-5 h-5 shrink-0" />
              <span
                className={cn(
                  "transition-all duration-300 whitespace-nowrap",
                  isCollapsed
                    ? "xl:opacity-0 xl:w-0 overflow-hidden"
                    : "opacity-100",
                )}
              >
                Quick Add
              </span>
            </button>
          </div>
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden xl:flex absolute -right-3 top-20 w-6 h-6 bg-background border border-primary/20 rounded-full items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors z-50 shadow-sm"
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
