"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

// Descendants that own their own click. The expand control itself is a
// `button`, so it matches too - which is what keeps a click on the chevron
// from toggling twice.
const SELF_HANDLING =
  'a, button, input, select, textarea, label, [role="button"], [role="menu"], [role="menuitem"], [role="dialog"], [data-no-row-toggle]';

/**
 * Props that make a whole table row a click target for its own expand control,
 * so the row does not only respond around the product name.
 *
 * The `ExpandRowButton` stays the real control - it keeps `aria-expanded`, the
 * label, and keyboard access. This only adds the pointer affordance, so the row
 * itself is deliberately not given a role: a screen reader would otherwise
 * announce the same toggle twice. Give the row `cursor-pointer` to match.
 */
export function rowToggleProps(onToggle: () => void) {
  return {
    onClick: (event: MouseEvent<HTMLElement>) => {
      const target = event.target as Element | null;
      if (!target) return;

      // React portals bubble through the React tree, not the DOM one, so a
      // click inside a menu rendered elsewhere would otherwise land here.
      if (!event.currentTarget.contains(target)) return;
      if (target.closest(SELF_HANDLING)) return;

      // Finishing a text selection inside the row is not a click on it.
      if (window.getSelection()?.isCollapsed === false) return;

      onToggle();
    },
  };
}

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
