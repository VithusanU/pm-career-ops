/** Monday 00:00 (local) through next Monday 00:00 — the current work week. */
export function currentWeekRange(now: Date = new Date()): { start: Date; end: Date } {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = d.getDay(); // 0 = Sun ... 6 = Sat
  const diffToMonday = (day + 6) % 7; // Mon = 0
  const start = new Date(d);
  start.setDate(d.getDate() - diffToMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

export function isWithinRange(dateStr: string | null | undefined, start: Date, end: Date): boolean {
  if (!dateStr) return false;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return false;
  return t >= start.getTime() && t < end.getTime();
}
