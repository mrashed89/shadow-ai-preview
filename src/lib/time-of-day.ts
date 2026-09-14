export type TimeOfDay = "day" | "night";

/** Business/day hours: 7:00–18:59 local. Night: otherwise. */
export function getTimeOfDay(date = new Date()): TimeOfDay {
  const hour = date.getHours();
  return hour >= 7 && hour < 19 ? "day" : "night";
}

export function daysTogether(lockedAt: Date | string, now = new Date()) {
  const start = typeof lockedAt === "string" ? new Date(lockedAt) : lockedAt;
  const ms = Math.max(0, now.getTime() - start.getTime());
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function ageLabel(days: number) {
  if (days <= 0) return "Day 0 — just locked in";
  if (days === 1) return "1 day together";
  if (days < 30) return `${days} days together`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 month together";
  if (months < 12) return `${months} months together`;
  const years = Math.floor(days / 365);
  return years === 1 ? "1 year together" : `${years} years together`;
}
