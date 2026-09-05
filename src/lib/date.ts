/**
 * Calendar days, not instants.
 *
 * `dateAcquired` and `dateSold` are days the user picked - no screen in the app
 * ever renders a clock for them. They live in `timestamp without time zone`
 * columns, so a value written with `.toISOString()` lands as a *UTC* wall clock
 * with nothing recording that it was UTC, and reads back a day early for every
 * user east of Greenwich (a Sydney user picking 6 Jul stored `2026-07-05
 * 14:00`). These helpers keep the day the user meant intact end to end: the
 * client resolves the day in its own timezone, the server stores it at
 * midnight, and rendering never re-interprets it against a timezone again.
 */

/** A calendar day with no time and no timezone: `YYYY-MM-DD`. */
export type CalendarDay = string;

const DAY_PREFIX = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * The day a `Date` falls on in the *caller's* timezone. Call this on the
 * client: a `Date` crossing the server boundary is only an instant, so the
 * user's day cannot be recovered once it arrives.
 */
export function toCalendarDay(date: Date): CalendarDay {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Today, in the caller's timezone. */
export function todayCalendarDay(): CalendarDay {
  return toCalendarDay(new Date());
}

/**
 * A day as a `Date` at *local* midnight, for date pickers and `date-fns`.
 * Never `new Date("2026-09-05")` - the spec parses a bare date as UTC midnight,
 * which is the very shift this module exists to remove.
 */
export function parseCalendarDay(value: string): Date | null {
  const match = DAY_PREFIX.exec(value.trim());
  if (!match) return null;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * The day part of anything the database hands back (`2026-09-05T00:00:00`,
 * `2026-09-05 00:00:00`, `2026-09-05T00:00:00+00:00`), ignoring the clock.
 */
export function calendarDayOf(value: string): CalendarDay | null {
  const match = DAY_PREFIX.exec(value.trim());
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

/**
 * Normalises whatever a server action was handed into a day. Accepts the
 * `YYYY-MM-DD` strings the modals send, the same strings from AI import and CSV
 * restore, and - for payloads that predate this contract - a `Date`, whose UTC
 * day is the best guess available server-side.
 */
export function parseCalendarDayInput(
  value: unknown,
  field: string,
): CalendarDay | undefined {
  if (value === undefined || value === null || value === "") return undefined;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error(`Invalid ${field}: could not parse date.`);
    }
    return assertInRange(value.toISOString().slice(0, 10), field);
  }

  if (typeof value === "string") {
    const day = calendarDayOf(value);
    if (day) return assertInRange(day, field);
    // Non-ISO leftovers ("5 September 2026") still deserve a real answer.
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return assertInRange(toCalendarDay(parsed), field);
    }
  }

  throw new Error(`Invalid ${field}: could not parse date.`);
}

/**
 * A day as the value to write to a `timestamp without time zone` column:
 * midnight, no offset, so it reads back as the same day everywhere.
 */
export function toStoredTimestamp(day: CalendarDay): string {
  return `${day}T00:00:00.000`;
}

function assertInRange(day: CalendarDay, field: string): CalendarDay {
  const year = Number(day.slice(0, 4));
  if (year < 1970 || year > 3000) {
    throw new Error(`Invalid ${field}: date out of range.`);
  }
  return day;
}
