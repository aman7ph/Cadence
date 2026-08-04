// Repeatable tasks — a task that must be completed N times, with a minimum
// interval enforced between consecutive completions ("reps").
//
// The interval is deliberately NOT a schedule. It is always measured from the
// most recent rep, so falling behind never earns a burst of free reps:
//
//   interval 1h, rep at 2:00 → next allowed 3:00
//   user forgets, reps at 3:35 → next allowed 4:35 (not 4:00)
//
// That "anchored on the last rep" property is what makes the gate honest, and
// it is why every function here takes `lastRepAt` rather than a start time.
//
// These are the only time-of-day aware helpers in the codebase. Everything
// else in Cadence works in client-local YYYY-MM-DD day strings; reps also
// carry a day string for counting, but the gate itself is pure elapsed time
// and is intentionally blind to day boundaries (a rep at 23:50 with a 1h
// interval still blocks at 00:05, even though the day's count has reset).

export const MIN_REPEAT_TARGET = 2;
export const MAX_REPEAT_TARGET = 100;
export const MAX_REPEAT_INTERVAL_MINUTES = 1440; // 24h

const MS_PER_MINUTE = 60_000;

// Epoch ms at which the next rep becomes allowed, or undefined when nothing
// is blocking one (no rep logged yet, or no interval configured).
export function nextAllowedAt(
  lastRepAt: number | undefined,
  intervalMinutes: number | undefined,
): number | undefined {
  if (lastRepAt === undefined) return undefined;
  if (!intervalMinutes || intervalMinutes <= 0) return undefined;
  return lastRepAt + intervalMinutes * MS_PER_MINUTE;
}

// Milliseconds left on the gate. Never negative, so callers can compare
// against 0 without worrying about clock drift past the deadline.
export function remainingMs(
  nextAllowedAt: number | undefined,
  now: number,
): number {
  if (nextAllowedAt === undefined) return 0;
  return Math.max(0, nextAllowedAt - now);
}

// The authoritative gate check. The server calls this with its own clock —
// the client's copy is only ever used to disable a button.
export function isRepAllowed(
  lastRepAt: number | undefined,
  intervalMinutes: number | undefined,
  now: number,
): boolean {
  return remainingMs(nextAllowedAt(lastRepAt, intervalMinutes), now) === 0;
}

// "04:13" under an hour, "1:04:13" at or above it. Seconds round up so the
// countdown never reads 00:00 while the gate is still closed.
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

// Humanizes a raw minute count for the creation forms — "90" reads back as
// "1h 30m", so a free-text minutes input can't be misread as hours.
export function formatIntervalMinutes(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "no wait";
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

// Validation shared by the backend mutations and the creation forms, so both
// reject the same values. A target of 1 is just a normal task.
export function isValidRepeatTarget(target: number): boolean {
  return (
    Number.isInteger(target) &&
    target >= MIN_REPEAT_TARGET &&
    target <= MAX_REPEAT_TARGET
  );
}

// 0 means "no gate" — a valid choice: N reps with no waiting period.
export function isValidRepeatIntervalMinutes(minutes: number): boolean {
  return (
    Number.isInteger(minutes) &&
    minutes >= 0 &&
    minutes <= MAX_REPEAT_INTERVAL_MINUTES
  );
}
