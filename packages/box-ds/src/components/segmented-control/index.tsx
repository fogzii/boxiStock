"use client";

import * as React from "react";
import { cn } from "../../utils/cn";

interface SegmentedItem<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  items: readonly SegmentedItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  className,
  ariaLabel,
  disabled,
}: SegmentedControlProps<T>) {
  const itemRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  function focusAt(index: number) {
    const next = items[index];
    if (!next) return;
    onChange(next.value);
    itemRefs.current[index]?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLFieldSetElement>) {
    if (disabled || items.length === 0) return;
    const current = items.findIndex((item) => item.value === value);
    const index = current === -1 ? 0 : current;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      focusAt((index + 1) % items.length);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      focusAt((index - 1 + items.length) % items.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusAt(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusAt(items.length - 1);
    }
  }

  return (
    <fieldset
      disabled={disabled}
      onKeyDown={onKeyDown}
      className={cn(
        "relative m-0 min-w-0 border-0 p-0 [min-inline-size:0]",
        className,
      )}
    >
      {ariaLabel ? (
        <legend className="absolute h-px w-px overflow-hidden border-0 p-0 whitespace-nowrap [clip:rect(0,0,0,0)]">
          {ariaLabel}
        </legend>
      ) : null}
      <div className="flex w-full gap-1 rounded-xl bg-primary/8 p-1">
        {items.map((item, index) => {
          const active = item.value === value;
          return (
            <button
              key={item.value}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              type="button"
              aria-pressed={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(item.value)}
              className={cn(
                "flex min-w-0 flex-1 cursor-pointer items-center justify-center whitespace-nowrap rounded-lg px-4 py-1.5 text-body-sm-strong transition-all outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring/50",
                "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export type { SegmentedControlProps, SegmentedItem };
export { SegmentedControl };
