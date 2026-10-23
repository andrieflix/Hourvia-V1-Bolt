export type DurationMs = number;

export function hoursFromMs(ms: DurationMs): number {
  return ms / 3_600_000;
}

export function msFromHours(hours: number): DurationMs {
  return Math.round(hours * 3_600_000);
}

export function formatDuration(ms: DurationMs): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatHours(ms: DurationMs): string {
  return hoursFromMs(ms).toFixed(2);
}

export function formatHoursDecimal(ms: DurationMs): string {
  const hours = hoursFromMs(ms);
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  if (minutes === 0) return `${whole}h`;
  return `${whole}h ${minutes}m`;
}

export function getWeekRange(date: Date = new Date()): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
}

export function formatUTCDate(date: Date): string {
  return date.toISOString().replace("T", " ").slice(0, 19) + " UTC";
}
