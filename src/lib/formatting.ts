export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatCurrency(n: number): string {
  return currencyFormatter.format(n);
}

// Pinned, like the currency formatter above. `toLocaleDateString(undefined)`
// resolves to the *runtime's* locale, so Node rendered "Aug 22, 2026" while the
// browser rendered "22 Aug 2026" and React threw a hydration mismatch. en-AU
// matches the day/month order the date pickers already use.
const dateFormatter = new Intl.DateTimeFormat("en-AU", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "-";
  return dateFormatter.format(date);
}

/**
 * Plain dollar amount with the sign ahead of the symbol — "-$12.00", not
 * "$-12.00". Matches the unseparated `$0.00` style the stock table uses.
 */
export function formatSignedAmount(n: number): string {
  return `${n < 0 ? "-" : ""}$${Math.abs(n).toFixed(2)}`;
}

export function parseIntQty(raw: string, fallback = 1): number {
  const n = Math.floor(parseFloat(raw));
  return Number.isFinite(n) && n >= 1 ? n : fallback;
}

export function parseCurrencyInput(raw: string): string {
  const n = parseFloat(raw);
  return Number.isFinite(n) ? (Math.round(n * 100) / 100).toFixed(2) : raw;
}

export function generateLotIdentity(): string {
  const now = new Date();
  const date = now.toISOString().split("T")[0].replace(/-/g, "");
  const time = now.toTimeString().slice(0, 8).replace(/:/g, "");
  return `L-${date}-${time}`;
}
