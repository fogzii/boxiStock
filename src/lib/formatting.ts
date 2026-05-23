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

export function parseIntQty(raw: string, fallback = 1): number {
  const n = Math.floor(parseFloat(raw));
  return Number.isFinite(n) && n >= 1 ? n : fallback;
}

export function parseCurrencyInput(raw: string): string {
  const n = parseFloat(raw);
  return Number.isFinite(n) ? (Math.round(n * 100) / 100).toFixed(2) : raw;
}
