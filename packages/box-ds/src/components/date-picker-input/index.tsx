"use client";

import * as React from "react";
import type { DatePickerProps } from "react-date-picker";
import DatePicker from "react-date-picker";

import { cn } from "../../utils/cn";

function DatePickerInput({
  clearIcon = null,
  className,
  isOpen,
  onCalendarClose,
  onCalendarOpen,
  portalContainer,
  ...props
}: DatePickerProps) {
  const anchorRef = React.useRef<HTMLDivElement | null>(null);
  const ownedPortalRef = React.useRef<HTMLDivElement | null>(null);
  const [calendarContainer, setCalendarContainer] =
    React.useState<HTMLElement | null>(portalContainer ?? null);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(Boolean(isOpen));

  const updatePortalPosition = React.useCallback(() => {
    const anchor = anchorRef.current;
    const portal = ownedPortalRef.current;

    if (!anchor || !portal) return;

    const viewportPadding = 8;
    const maxCalendarWidth = 280;
    const rect = anchor.getBoundingClientRect();
    const width = Math.min(
      maxCalendarWidth,
      window.innerWidth - viewportPadding * 2,
    );
    const left = Math.min(
      Math.max(rect.left, viewportPadding),
      window.innerWidth - width - viewportPadding,
    );

    portal.style.position = "fixed";
    portal.style.top = `${rect.bottom + viewportPadding}px`;
    portal.style.left = `${left}px`;
    portal.style.width = `${width}px`;
    portal.style.zIndex = "100";
  }, []);

  React.useEffect(() => {
    if (portalContainer) {
      setCalendarContainer(portalContainer);
      return;
    }

    const portal = document.createElement("div");
    portal.className = "box-date-picker-portal";
    document.body.appendChild(portal);
    ownedPortalRef.current = portal;
    setCalendarContainer(portal);

    return () => {
      portal.remove();
      ownedPortalRef.current = null;
      setCalendarContainer(null);
    };
  }, [portalContainer]);

  React.useEffect(() => {
    if (isOpen !== null && isOpen !== undefined) {
      setIsCalendarOpen(isOpen);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!isCalendarOpen || portalContainer) return;

    updatePortalPosition();
    const animationFrame = window.requestAnimationFrame(updatePortalPosition);

    window.addEventListener("resize", updatePortalPosition);
    window.addEventListener("scroll", updatePortalPosition, true);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", updatePortalPosition);
      window.removeEventListener("scroll", updatePortalPosition, true);
    };
  }, [isCalendarOpen, portalContainer, updatePortalPosition]);

  return (
    <div ref={anchorRef} className="box-date-picker relative w-full">
      <DatePicker
        clearIcon={clearIcon}
        portalContainer={portalContainer ?? calendarContainer}
        isOpen={isOpen}
        onCalendarClose={() => {
          setIsCalendarOpen(false);
          onCalendarClose?.();
        }}
        onCalendarOpen={() => {
          setIsCalendarOpen(true);
          updatePortalPosition();
          onCalendarOpen?.();
        }}
        className={cn(
          "min-h-11 w-full rounded-md border border-body bg-canvas text-body-md [color-scheme:dark]",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export { DatePickerInput };
