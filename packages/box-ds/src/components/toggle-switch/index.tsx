"use client";

import type * as React from "react";

import { cn } from "../../utils/cn";

interface ToggleSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  id?: string;
}

function ToggleSwitch({
  checked,
  onCheckedChange,
  label,
  disabled,
  className,
  id,
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      data-slot="toggle-switch"
      className={cn(
        "group/switch flex cursor-pointer items-center gap-3 outline-none select-none disabled:pointer-events-none disabled:opacity-50",
        label && "w-full justify-between",
        className,
      )}
    >
      {label && (
        <span className="text-body-sm text-foreground text-left">{label}</span>
      )}
      <span
        aria-hidden="true"
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          "group-focus-visible/switch:ring-3 group-focus-visible/switch:ring-ring/50",
          checked ? "bg-primary" : "bg-primary/15",
        )}
      >
        <span
          className={cn(
            "size-4 rounded-full bg-ink-deep shadow-sm transition-transform",
            checked ? "translate-x-4.5" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

export type { ToggleSwitchProps };
export { ToggleSwitch };
