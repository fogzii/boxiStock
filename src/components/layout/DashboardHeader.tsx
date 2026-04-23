"use client";

import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onToggleSidebar: () => void;
  className?: string;
}

export function DashboardHeader({ onToggleSidebar, className }: HeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center px-4 sm:px-8 pt-3 sm:pt-4 mb-2 shrink-0 md:hidden",
        className,
      )}
    >
      <button
        type="button"
        onClick={onToggleSidebar}
        className="md:hidden p-2 -ml-2 text-foreground/70 hover:text-foreground transition-colors hover:bg-primary/10 rounded-lg"
        aria-label="Toggle Menu"
      >
        <Menu className="w-6 h-6" />
      </button>
    </div>
  );
}
