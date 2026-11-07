/**
 * Pure, client-safe formatting helpers shared by the dashboard and the create flow.
 *
 * Everything that is rendered during SSR uses a fixed locale and (where it matters) an explicit
 * time zone, so the server HTML and the first client render are byte-identical (no hydration
 * mismatches). Components switch to the viewer's local time zone after hydration.
 */

export const LOCALE = "en-US";

const DAY_MS = 86_400_000;

const integerFormat = new Intl.NumberFormat(LOCALE);
const compactFormat = new Intl.NumberFormat(LOCALE, {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** 1,284 — or 12.9K / 4.2M once numbers get large. */
export function formatCount(value: number) {
  return Math.abs(value) >= 100_000
    ? compactFormat.format(value)
    : integerFormat.format(value);
}

export function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`,
) {
  return `${formatCount(count)} ${count === 1 ? singular : plural}`;
}

/** `"2026-11-03"` (UTC calendar day) → Date at UTC midnight. */
function parseUtcDay(day: string) {
  return new Date(`${day}T00:00:00Z`);
}

export function formatUtcDay(
  day: string,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
) {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: "UTC",
    ...options,
  }).format(parseUtcDay(day));
}

/**
 * Short absolute date. Pass `timeZone: "UTC"` for deterministic SSR output; omit it to use the
 * viewer's time zone (client only, after hydration).
 */
export function formatDate(
  date: Date,
  { timeZone, withYear }: { timeZone?: string; withYear?: boolean } = {},
) {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    month: "short",
    day: "numeric",
    year: withYear ? "numeric" : undefined,
  }).format(date);
}

export function formatDateTime(date: Date, timeZone?: string) {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

const relativeFormat = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * DAY_MS],
  ["month", 30 * DAY_MS],
  ["week", 7 * DAY_MS],
  ["day", DAY_MS],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

/** "just now", "5 minutes ago", "yesterday", "in 3 days"… */
export function formatRelative(date: Date, now: number) {
  const diff = date.getTime() - now;
  const abs = Math.abs(diff);
  if (abs < 45_000) return diff < 0 ? "just now" : "in a moment";

  for (const [unit, ms] of RELATIVE_UNITS) {
    if (abs >= ms || unit === "minute") {
      return relativeFormat.format(Math.round(diff / ms), unit);
    }
  }
  return relativeFormat.format(Math.round(diff / 60_000), "minute");
}

/**
 * Compact time since, for tight spaces: "just now", "3m ago", "5h ago", "4d ago", then the date
 * ("Oct 14", with the year once it's another year). Pass `timeZone: "UTC"` for SSR output.
 */
export function formatAgo(date: Date, now: number, timeZone?: string) {
  const diff = Math.max(0, now - date.getTime());
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < DAY_MS) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 30 * DAY_MS) return `${Math.floor(diff / DAY_MS)}d ago`;
  return formatDate(date, {
    timeZone,
    withYear: new Date(now).getUTCFullYear() !== date.getUTCFullYear(),
  });
}

export type ExpiryStatus =
  | { kind: "never" }
  | { kind: "expired"; expiresAt: Date }
  | { kind: "soon"; expiresAt: Date }
  | { kind: "later"; expiresAt: Date };

/** Links that expire within this window are flagged. */
const EXPIRING_SOON_MS = 7 * DAY_MS;

export function getExpiryStatus(
  expiresAt: Date | null,
  now: number,
): ExpiryStatus {
  if (!expiresAt) return { kind: "never" };
  const remaining = expiresAt.getTime() - now;
  if (remaining <= 0) return { kind: "expired", expiresAt };
  if (remaining < EXPIRING_SOON_MS) return { kind: "soon", expiresAt };
  return { kind: "later", expiresAt };
}

/** Compact time left, rounded down: "17h 5m", "42m", "under a minute" (for ≥ 0 ms). */
export function formatTimeLeft(ms: number) {
  const minutes = Math.floor(Math.max(0, ms) / 60_000);
  if (minutes < 1) return "under a minute";
  const hours = Math.floor(minutes / 60);
  if (hours === 0) return `${minutes}m`;
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

/** A ticking countdown clock, rounded up so it reads 0:00:00 only when time is up: "17:42:09". */
export function formatClock(ms: number) {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** Split a destination into an emphasised host and a muted remainder. */
export function splitUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.host.replace(/^www\./, "");
    const rest = `${parsed.pathname === "/" ? "" : parsed.pathname}${parsed.search}${parsed.hash}`;
    return { host, rest };
  } catch {
    return { host: url, rest: "" };
  }
}

export type Trend =
  | { kind: "none" } // no clicks in either period
  | { kind: "new" } // clicks now, none before: a percentage would be meaningless
  | { kind: "flat" }
  | { kind: "up" | "down"; percent: number };

export function getTrend(current: number, previous: number): Trend {
  if (current === 0 && previous === 0) return { kind: "none" };
  if (previous === 0) return { kind: "new" };
  const change = ((current - previous) / previous) * 100;
  const percent = Math.round(Math.abs(change));
  if (percent === 0) return { kind: "flat" };
  return { kind: change > 0 ? "up" : "down", percent };
}

const TIME_VALUE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Local time of day as `"HH:MM"` (24h), the value format of `<input type="time">`. */
export function toTimeValue(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/**
 * The local calendar day of `day` at `time` (`"HH:MM"`) in the viewer's time zone, or null when the
 * time is missing or malformed. Seconds are zero: timestamps are stored in whole seconds, and a
 * fractional second would be rounded by Postgres.
 */
export function atLocalTime(day: Date, time: string) {
  const match = TIME_VALUE.exec(time);
  if (!match) return null;
  const result = new Date(day);
  result.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return result;
}

/** `"Fri, Nov 13, 2026, 8:45 PM"`: an expiry moment in the viewer's time zone (client only). */
export function formatExpiry(date: Date) {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function startOfLocalDay(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

/** Same local wall-clock time `days` calendar days later (stays put across DST changes). */
export function addLocalDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
