"use client";

import { cn } from "@/lib/utils";

interface StatusToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export function StatusToggle({
  value: isStocked,
  onChange,
}: StatusToggleProps) {
  return (
    <div className="flex p-1 bg-canvas border border-body rounded-lg">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "flex-1 py-1.5 text-body-sm-strong rounded-md transition-all",
          isStocked
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        In Hand
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "flex-1 py-1.5 text-body-sm-strong rounded-md transition-all",
          !isStocked
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Pending
      </button>
    </div>
  );
}
