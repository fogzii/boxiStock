"use client";

import { CustomTooltip, Label, ToggleSwitch } from "@box-ds";
import { Info } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

export const SECTIONS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "stock", label: "Stock Inventory" },
  { key: "sales", label: "Sales History" },
] as const;

export function sectionLabel(key: string) {
  return SECTIONS.find((s) => s.key === key)?.label ?? key;
}

export type ShareConfigValue = {
  sections: string[];
  showStockAmounts: boolean;
  showSellPrice: boolean;
  showProjectedProfit: boolean;
};

export const DEFAULT_SHARE_CONFIG: ShareConfigValue = {
  sections: SECTIONS.map((s) => s.key),
  showStockAmounts: true,
  // Both opt-in: pricing and margin stay private unless deliberately shared.
  showSellPrice: false,
  showProjectedProfit: false,
};

export const pillClass = (active: boolean) =>
  cn(
    "px-3 py-1.5 rounded-md border text-body-sm-strong transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none",
    active
      ? "bg-primary/20 border-primary/40 text-primary"
      : "bg-background/50 border-primary/20 text-muted-foreground hover:border-primary/40 hover:text-foreground",
  );

interface ShareConfigFieldsProps {
  value: ShareConfigValue;
  onChange: (value: ShareConfigValue) => void;
  disabled?: boolean;
  /** Extra rows rendered inside the "Advanced settings" group (e.g. the
   * password toggle on public links). */
  advanced?: React.ReactNode;
}

/**
 * Reusable section + advanced-settings picker used by public link create/edit
 * and invite send/edit flows.
 */
export function ShareConfigFields({
  value,
  onChange,
  disabled,
  advanced,
}: ShareConfigFieldsProps) {
  const toggleSection = (key: string) => {
    const next = value.sections.includes(key)
      ? value.sections.filter((s) => s !== key)
      : [...value.sections, key];
    // The toggle only applies while stock is shared; reset when stock is
    // deselected so a stale "hidden" doesn't silently persist.
    const nextShowStockAmounts = next.includes("stock")
      ? value.showStockAmounts
      : true;
    onChange({
      sections: next,
      showStockAmounts: nextShowStockAmounts,
      // Mirrors normalizeConfig: both fall back to hidden, never shown.
      showSellPrice: next.includes("stock") ? value.showSellPrice : false,
      showProjectedProfit:
        (next.includes("stock") || next.includes("dashboard")) &&
        nextShowStockAmounts
          ? value.showProjectedProfit
          : false,
    });
  };

  const showsStock = value.sections.includes("stock");
  // Sell price is a stock-table column and reveals nothing about cost, so it
  // only needs the stock section. Projected profit additionally needs purchase
  // prices shared — see normalizeConfig for why.
  const offerSellPrice = showsStock;
  const showsProjections =
    (showsStock || value.sections.includes("dashboard")) &&
    value.showStockAmounts;

  return (
    <>
      <div className="flex flex-col gap-2">
        <Label className="font-bold">Sections to share</Label>
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => toggleSection(key)}
              className={pillClass(value.sections.includes(key))}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {(showsStock || offerSellPrice || showsProjections || advanced) && (
        <div className="flex flex-col gap-3">
          <Label className="font-bold">Advanced settings</Label>
          {showsStock && (
            <ToggleSwitch
              label={
                <span className="flex items-center gap-1.5">
                  Hide stock inventory prices
                  <CustomTooltip content="Viewers won't be able to see how much you paid for the stock in your inventory.">
                    <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </CustomTooltip>
                </span>
              }
              checked={!value.showStockAmounts}
              onCheckedChange={(checked) =>
                onChange({
                  ...value,
                  showStockAmounts: !checked,
                  // Hiding prices withdraws projections too — otherwise the
                  // cost is recoverable from sell price minus profit.
                  showProjectedProfit: checked
                    ? false
                    : value.showProjectedProfit,
                })
              }
              disabled={disabled}
            />
          )}
          {offerSellPrice && (
            <ToggleSwitch
              label={
                <span className="flex items-center gap-1.5">
                  Share sell price
                  <CustomTooltip content="Shows the per-unit price you plan to sell at. Reveals nothing about what you paid.">
                    <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </CustomTooltip>
                </span>
              }
              checked={value.showSellPrice}
              onCheckedChange={(checked) =>
                onChange({ ...value, showSellPrice: checked })
              }
              disabled={disabled}
            />
          )}
          {showsProjections && (
            <ToggleSwitch
              label={
                <span className="flex items-center gap-1.5">
                  Share projected profit
                  <CustomTooltip content="Off by default. Shows the margin you expect to make on stock you still hold, on the inventory table and the dashboard.">
                    <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </CustomTooltip>
                </span>
              }
              checked={value.showProjectedProfit}
              onCheckedChange={(checked) =>
                onChange({ ...value, showProjectedProfit: checked })
              }
              disabled={disabled}
            />
          )}
          {advanced}
        </div>
      )}
    </>
  );
}

export function ConfigSummary({
  sections,
  showStockAmounts,
  showSellPrice,
  showProjectedProfit,
  className,
}: ShareConfigValue & { className?: string }) {
  const parts = SECTIONS.filter((s) => sections.includes(s.key)).map((s) =>
    s.key === "stock" && !showStockAmounts ? `${s.label} (no $)` : s.label,
  );
  if (showSellPrice) parts.push("sell price");
  if (showProjectedProfit) parts.push("projected profit");
  return (
    <span className={className}>
      {parts.length > 0 ? parts.join(", ") : "No sections"}
    </span>
  );
}
