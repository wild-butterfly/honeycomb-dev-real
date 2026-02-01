// src/utils/date.ts
export function toLocalISOString(d: Date) {
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset)
    .toISOString()
    .slice(0, -1);
}
export function getStartOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);

  return d;
}