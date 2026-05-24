"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { MoreVertical } from "lucide-react";
import type * as React from "react";
import { cn } from "../../utils/cn";

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  variant?: "default" | "destructive";
  onClick?: () => void;
  disabled?: boolean;
}

export interface ActionMenuProps {
  items: ActionMenuItem[];
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  triggerClassName?: string;
}

export function ActionMenu({
  items,
  side = "bottom",
  align = "end",
  triggerClassName,
}: ActionMenuProps) {
  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger
        className={cn(
          "inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-mute outline-none transition-colors",
          "hover:bg-primary-pale hover:text-ink",
          "focus-visible:ring-2 focus-visible:ring-primary/50",
          "data-[popup-open]:bg-primary-pale data-[popup-open]:text-ink",
          triggerClassName,
        )}
        aria-label="Open actions menu"
      >
        <MoreVertical className="size-4" />
      </MenuPrimitive.Trigger>

      <MenuPrimitive.Portal>
        <MenuPrimitive.Positioner side={side} align={align} sideOffset={6}>
          <MenuPrimitive.Popup
            className={cn(
              "z-50 min-w-[180px] rounded-xl border border-mute/20 bg-canvas p-1 outline-none",
              "shadow-level3",
              "data-[starting-style]:opacity-0 data-[starting-style]:scale-95",
              "data-[ending-style]:opacity-0 data-[ending-style]:scale-95",
              "transition-[opacity,transform] duration-150 ease-out",
            )}
          >
            {items.map((item) => (
              <MenuPrimitive.Item
                key={item.label}
                onClick={item.onClick}
                disabled={item.disabled}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-body-sm outline-none transition-colors",
                  "data-[highlighted]:bg-primary-pale",
                  item.variant === "destructive"
                    ? "text-negative data-[highlighted]:bg-negative-bg"
                    : "text-ink",
                  item.disabled && "pointer-events-none opacity-40",
                )}
              >
                {item.icon && (
                  <span className="shrink-0 [&_svg]:size-4">{item.icon}</span>
                )}
                {item.label}
              </MenuPrimitive.Item>
            ))}
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  );
}
