"use client";

import {
  CheckCircle2,
  CircleAlert,
  CircleDollarSign,
  Info,
  TriangleAlert,
} from "lucide-react";
import { Toaster as SonnerToaster } from "sonner";

/**
 * The app's toast surface, themed to DESIGN.md's `ex-toast`: canvas surface,
 * `rounded.xl`, `spacing.md spacing.lg` padding, `body-sm`, Level 2 elevation.
 *
 * Sonner's `richColors` is deliberately off - it paints its own green/red
 * surfaces, which are not our palette. The surface stays canvas for every
 * variant, exactly as the spec says, and the status reads from the icon and
 * the left edge in the semantic colour families instead.
 */
/**
 * Icon for a recorded sale, passed per-toast as `{ icon: saleToastIcon }`.
 *
 * Money in is the one success worth marking as its own event, so it gets the
 * brand purple and a dollar rather than the generic tick. Deliberately not the
 * global `success` icon: most success toasts here are "Share link created" or
 * "Message sent", where a dollar would be nonsense. Same circular silhouette
 * and 20px box as `CheckCircle2` so the two sit at identical weight.
 */
export const saleToastIcon = (
  <CircleDollarSign className="h-5 w-5 text-primary" />
);

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      theme="dark"
      icons={{
        success: <CheckCircle2 className="h-5 w-5 text-positive" />,
        error: <CircleAlert className="h-5 w-5 text-negative" />,
        warning: <TriangleAlert className="h-5 w-5 text-warning" />,
        info: <Info className="h-5 w-5 text-primary" />,
      }}
      toastOptions={{
        classNames: {
          // Geometry only. The accent colour per variant lives in globals.css
          // keyed off sonner's `data-type`: these utilities carry `!important`,
          // so a second set of colour classes would be decided by stylesheet
          // order rather than by variant.
          toast:
            "!bg-canvas !border-l-2 !border-y-0 !border-r-0 !rounded-xl !px-4 !py-3 !gap-3 !shadow-level2 !font-sans !text-body-sm !text-ink",
          title: "!text-body-sm !text-ink",
          description: "!text-caption !text-body",
          actionButton:
            "!bg-primary !text-primary-foreground !rounded-lg !text-body-sm-strong hover:!bg-primary-active cursor-pointer",
          cancelButton:
            "!bg-canvas-soft !text-body !rounded-lg !text-body-sm-strong hover:!text-ink cursor-pointer",
          closeButton:
            "!bg-canvas !border-primary/20 !text-body hover:!text-ink cursor-pointer",
        },
      }}
    />
  );
}
