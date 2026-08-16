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
  /**
   * `md` (default) is the form-row switch. `lg` is for switches that stand on
   * their own next to other controls, where the `md` track reads undersized.
   */
  size?: "md" | "lg";
}

// Each track is padded 2px around its knob, so the checked offset is
// track − knob − 2: 36 − 16 − 2 = 18px (`translate-x-4.5`), 44 − 20 − 2 = 22px
// (`translate-x-5.5`).
const switchSizes = {
  md: { track: "h-5 w-9", knob: "size-4", checked: "translate-x-4.5" },
  lg: { track: "h-6 w-11", knob: "size-5", checked: "translate-x-5.5" },
} as const;

function ToggleSwitch({
  checked,
  onCheckedChange,
  label,
  disabled,
  className,
  id,
  size = "md",
}: ToggleSwitchProps) {
  const sizing = switchSizes[size];

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
          "relative inline-flex shrink-0 items-center rounded-full transition-colors",
          "group-focus-visible/switch:ring-3 group-focus-visible/switch:ring-ring/50",
          sizing.track,
          checked ? "bg-primary" : "bg-primary/15",
        )}
      >
        <span
          className={cn(
            "rounded-full bg-ink-deep shadow-sm transition-transform",
            sizing.knob,
            checked ? sizing.checked : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

export type { ToggleSwitchProps };
export { ToggleSwitch };
