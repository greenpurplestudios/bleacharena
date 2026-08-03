/**
 * Global server time for Bleach Arena = Saudi Arabia (UTC+3).
 * All daily/weekly resets follow this clock, matching the database.
 */
export const SERVER_UTC_OFFSET_MIN = 180;

const OFFSET_MS = SERVER_UTC_OFFSET_MIN * 60_000;

/** A Date whose UTC getters return Saudi (UTC+3) wall-clock values. */
export function serverNow(now: number = Date.now()): Date {
  return new Date(now + OFFSET_MS);
}

/** YYYY-MM-DD in server time (matches current_day_key()). */
export function serverDayKey(now: number = Date.now()): string {
  const d = serverNow(now);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** Milliseconds until the next daily reset (00:00 Saudi time). */
export function msUntilServerMidnight(now: number = Date.now()): number {
  const d = serverNow(now);
  const next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
  return Math.max(0, next - (now + OFFSET_MS));
}

/** Milliseconds until the weekly reset (Monday 00:00 Saudi time). */
export function msUntilServerWeekReset(now: number = Date.now()): number {
  const d = serverNow(now);
  const daysAhead = ((8 - (d.getUTCDay() || 7)) % 7) || 7;
  const next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + daysAhead);
  return Math.max(0, next - (now + OFFSET_MS));
}

/** Monday of the current server week, as a Date for display formatting. */
export function serverWeekStart(now: number = Date.now()): Date {
  const d = serverNow(now);
  const diff = (d.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff));
}

export function formatHMS(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
