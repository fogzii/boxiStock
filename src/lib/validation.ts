/**
 * Lightweight, dependency-free input validators used by server actions.
 *
 * Server actions in Next.js can be invoked by any signed-in user with any
 * payload shape, so every action must validate its inputs before trusting
 * them. These helpers throw on bad input so callers can let the error
 * propagate to the client toast.
 */

export const MAX_QUANTITY = 1_000_000;
export const MAX_PRICE = 1_000_000_000;
export const MAX_NAME_LENGTH = 200;
export const MAX_LOT_IDENTITY_LENGTH = 200;
export const MAX_BULK_ITEMS = 1000;
export const MAX_AI_PROMPT_LENGTH = 8000;

export function assertPositiveInt(
  value: unknown,
  field: string,
  { max = MAX_QUANTITY }: { max?: number } = {},
): asserts value is number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value <= 0 ||
    value > max
  ) {
    throw new Error(
      `Invalid ${field}: must be a positive integer up to ${max}.`,
    );
  }
}

export function assertNonNegativeNumber(
  value: unknown,
  field: string,
  { max = MAX_PRICE }: { max?: number } = {},
): asserts value is number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > max
  ) {
    throw new Error(
      `Invalid ${field}: must be a non-negative number up to ${max}.`,
    );
  }
}

export function assertBoolean(
  value: unknown,
  field: string,
): asserts value is boolean {
  if (typeof value !== "boolean") {
    throw new Error(`Invalid ${field}: must be a boolean.`);
  }
}

/**
 * Returns a cleaned, length-bounded string. Throws if it's empty after trim.
 */
export function cleanRequiredString(
  value: unknown,
  field: string,
  { maxLength = MAX_NAME_LENGTH }: { maxLength?: number } = {},
): string {
  if (typeof value !== "string") {
    throw new Error(`Invalid ${field}: must be a string.`);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error(`Invalid ${field}: cannot be empty.`);
  }
  if (trimmed.length > maxLength) {
    throw new Error(
      `Invalid ${field}: must be ${maxLength} characters or fewer.`,
    );
  }
  return trimmed;
}

export function cleanOptionalString(
  value: unknown,
  field: string,
  { maxLength = MAX_NAME_LENGTH }: { maxLength?: number } = {},
): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    throw new Error(`Invalid ${field}: must be a string.`);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  if (trimmed.length > maxLength) {
    throw new Error(
      `Invalid ${field}: must be ${maxLength} characters or fewer.`,
    );
  }
  return trimmed;
}

/**
 * Parses a Date value coming from JSON (Date objects get serialized to ISO
 * strings across the server-action boundary). Accepts Date, ISO string, or
 * undefined. Rejects anything else and anything outside a sane range.
 */
export function parseOptionalDate(
  value: unknown,
  field: string,
): Date | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const d = value instanceof Date ? value : new Date(value as string);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid ${field}: could not parse date.`);
  }
  const year = d.getUTCFullYear();
  if (year < 1970 || year > 3000) {
    throw new Error(`Invalid ${field}: date out of range.`);
  }
  return d;
}

export function assertArrayWithLimit<T>(
  value: unknown,
  field: string,
  max = MAX_BULK_ITEMS,
): asserts value is T[] {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid ${field}: must be an array.`);
  }
  if (value.length === 0) {
    throw new Error(`Invalid ${field}: must not be empty.`);
  }
  if (value.length > max) {
    throw new Error(`Too many items in ${field}: limit is ${max}.`);
  }
}

/**
 * Escape the SQL LIKE/ILIKE wildcards `%` and `_` so user-supplied search
 * strings can't broaden the pattern beyond a substring match.
 */
export function escapeLikePattern(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}
