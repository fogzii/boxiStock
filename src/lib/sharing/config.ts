/**
 * Shared share-config domain logic. Plain module (not "use server") so it can
 * export constants and types to both server actions and client components.
 */

export const ALLOWED_SECTIONS = ["dashboard", "stock", "sales"] as const;

export const MAX_PUBLIC_LINKS = 5;

export type ShareConfig = {
  sections: string[];
  showStockAmounts: boolean;
  /** The per-unit price you intend to sell at. Off by default. */
  showSellPrice: boolean;
  /** Margin on unsold stock, on both the table and the dashboard. Off by default. */
  showProjectedProfit: boolean;
};

export function assertSections(
  sections: unknown,
): asserts sections is string[] {
  if (!Array.isArray(sections) || sections.length === 0)
    throw new Error("At least one section is required");
  for (const s of sections) {
    if (!(ALLOWED_SECTIONS as readonly string[]).includes(s))
      throw new Error(`Invalid section: ${s}`);
  }
}

/**
 * Dedupe sections and keep the stock-$ flag meaningful: when "stock" isn't
 * shared, force showStockAmounts back to true so a stale "hidden" doesn't
 * invisibly persist on the row.
 *
 * showSellPrice and showProjectedProfit work the other way round: both are
 * opt-in, so each falls back to false whenever the section it appears in isn't
 * shared. Getting this backwards would leak pricing, so false is the safe
 * default.
 *
 * showProjectedProfit additionally requires showStockAmounts, for two reasons:
 * the figure is derived from purchase prices that get stripped from the payload
 * when amounts are hidden, and alongside a visible sell price it would give up
 * the cost as `sell - profit`. showSellPrice carries no such constraint — an
 * asking price reveals nothing about what you paid.
 */
export function normalizeConfig(config: ShareConfig): ShareConfig {
  assertSections(config.sections);
  const sections = [...new Set(config.sections)];
  const showsStock = sections.includes("stock");
  const showsProjectedProfit = showsStock || sections.includes("dashboard");
  const showStockAmounts = showsStock ? !!config.showStockAmounts : true;
  return {
    sections,
    showStockAmounts,
    showSellPrice: showsStock ? !!config.showSellPrice : false,
    showProjectedProfit:
      showsProjectedProfit && showStockAmounts
        ? !!config.showProjectedProfit
        : false,
  };
}
