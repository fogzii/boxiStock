"use client";

import * as React from "react";
import { cn } from "../../utils/cn";

// Track geometry, kept in numbers because the sliding thumb has to be sized
// and stepped in `calc()`. Mirror any change in the track's `gap-1 p-1`.
const TRACK_PADDING = 4;
const TRACK_GAP = 4;

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

  // Every item is `flex-1` off a zero basis, so they are always equal width.
  // That lets the thumb be placed with pure `calc()` - no measuring, no resize
  // observer, and nothing to re-sync when the container width changes.
  const activeIndex = items.findIndex((item) => item.value === value);

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
      <div className="relative flex w-full gap-1 rounded-xl bg-primary/8 p-1">
        {/* One thumb that slides, rather than a background that pops on and off
            each button. Rendered only once an item actually matches, so it
            mounts already in place instead of sliding in from the first slot. */}
        {activeIndex >= 0 && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1 bottom-1 left-1 rounded-lg border border-ink-deep/15 bg-gradient-to-b from-canvas-soft/80 to-canvas-soft/40 shadow-level2 backdrop-blur-xl backdrop-saturate-150 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{
              width: `calc((100% - ${TRACK_PADDING * 2}px - ${
                TRACK_GAP * (items.length - 1)
              }px) / ${items.length})`,
              // The percentage in `translateX` is of the thumb's own width, so
              // one step is exactly one slot plus the gap between slots.
              transform: `translateX(calc(${activeIndex} * (100% + ${TRACK_GAP}px)))`,
            }}
          />
        )}
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
                // `relative` keeps the label painting over the thumb; the
                // transparent border holds the same box the thumb's border
                // draws, so nothing shifts by a pixel as it arrives.
                "relative flex min-w-0 flex-1 cursor-pointer items-center justify-center whitespace-nowrap rounded-lg border border-transparent px-4 py-1.5 text-body-sm-strong transition-colors duration-300 outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring/50",
                "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
                active
                  ? "text-primary"
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
