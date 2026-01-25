// src/utils/date.ts
export function toLocalISOString(d: Date) {
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset)
    .toISOString()
    .slice(0, -1);
}