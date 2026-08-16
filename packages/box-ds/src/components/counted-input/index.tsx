"use client";

import type * as React from "react";
import { cn } from "../../utils/cn";
import { Input } from "../input";

interface CountedInputProps extends React.ComponentProps<typeof Input> {
  maxLength?: number;
  showCount?: boolean;
}

function CountedInput({
  maxLength = 75,
  showCount = true,
  value,
  defaultValue,
  className,
  onChange,
  ...props
}: CountedInputProps) {
  const current =
    value !== undefined
      ? String(value)
      : defaultValue !== undefined
        ? String(defaultValue)
        : "";

  return (
    <div className="relative">
      <Input
        {...props}
        value={value}
        defaultValue={defaultValue}
        maxLength={maxLength}
        onChange={(event) => {
          const next = event.target.value.slice(0, maxLength);
          if (next !== event.target.value) {
            event.target.value = next;
          }
          onChange?.(event);
        }}
        className={cn(showCount && "pr-14", className)}
      />
      {showCount && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] tabular-nums text-muted-foreground/40">
          {current.length}/{maxLength}
        </span>
      )}
    </div>
  );
}

export type { CountedInputProps };
export { CountedInput };
