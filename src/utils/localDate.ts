/**
 * Parses timestamps as LOCAL time
 * Supports:
 * - "YYYY-MM-DD HH:mm:ss"
 * - "YYYY-MM-DDTHH:mm:ss"
 * - "YYYY-MM-DDTHH:mm:ss.SSSZ"
 */
export function parseLocalTimestamp(
  value?: string | null,
): Date | null {
  if (!value) return null;

  // Normalize ISO → space-separated local format
  const normalized = value
    .replace("T", " ")
    .replace("Z", "")
    .split(".")[0]; // strip milliseconds

  const [datePart, timePart = "00:00:00"] = normalized.split(" ");

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

  // 🔒 LOCAL time constructor (no timezone conversion)
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