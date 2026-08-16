"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ExpandRowButton({
  expanded,
  controlsId,
  label,
  onToggle,
  children,
  className,
  iconClassName,
}: {
  expanded: boolean;
  controlsId: string;
  label: string;
  onToggle: () => void;
  children?: ReactNode;
  className?: string;
  iconClassName?: string;
}) {
  const Icon = expanded ? ChevronDown : ChevronRight;

  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={controlsId}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        "flex min-w-0 cursor-pointer items-center gap-2 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
    >
      <Icon
        className={cn(
          "shrink-0 text-muted-foreground",
          iconClassName ?? "h-4 w-4",
        )}
      />
      {children}
    </button>
  );
}
