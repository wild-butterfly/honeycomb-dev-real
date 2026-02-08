// src/utils/localDate.ts

/**
 * Parses "YYYY-MM-DD HH:mm:ss" as LOCAL time
 * No UTC conversion
 * No timezone shift
 */
export function parseLocalTimestamp(
  value?: string | null,
): Date | null {
  if (!value) return null;

  // Expected: "2026-02-08 23:00:00"
  const [datePart, timePart = "00:00:00"] = value.split(" ");

  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, second = 0] = timePart.split(":").map(Number);

  if (
    !year ||
    !month ||
    !day ||
    hour === undefined ||
    minute === undefined
  ) {
    return null;
  }

  // 🔒 CRITICAL: numeric constructor = local time
  return new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    Number(second),
    0,
  );
}