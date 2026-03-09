"use client";

import { UserButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onToggleSidebar: () => void;
  className?: string;
  title?: string;
}

export function DashboardHeader({
  onToggleSidebar,
  className,
  title = "Dashboard Overview",
}: HeaderProps) {
  return (
    <header
      className={cn(
        "flex justify-between items-center mb-6 sm:mb-10 px-4 sm:px-8 pt-6 sm:pt-8 shrink-0",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        {/* Mobile Sidebar Toggle */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 -ml-2 text-foreground/70 hover:text-foreground transition-colors hover:bg-primary/10 rounded-lg"
          aria-label="Toggle Menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm hidden sm:block">
            Welcome back, here's what's happening today.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8 sm:w-10 sm:h-10 border-2 border-primary/20",
            },
          }}
        />
      </div>
    </header>
  );
}
