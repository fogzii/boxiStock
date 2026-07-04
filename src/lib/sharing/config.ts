/**
 * Shared share-config domain logic. Plain module (not "use server") so it can
 * export constants and types to both server actions and client components.
 */

export const ALLOWED_SECTIONS = ["dashboard", "stock", "sales"] as const;

export const MAX_PUBLIC_LINKS = 5;

export type ShareConfig = {
  sections: string[];
  showStockAmounts: boolean;
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
 */
export function normalizeConfig(config: ShareConfig): ShareConfig {
  assertSections(config.sections);
  const sections = [...new Set(config.sections)];
  return {
    sections,
    showStockAmounts: sections.includes("stock")
      ? !!config.showStockAmounts
      : true,
  };
}
