// src/utils/date.ts

/**
 * ❌ DEPRECATED
 * PostgreSQL `timestamp without time zone` ile ISO + timezone math
 * KULLANILMAMALIDIR.
 *
 * Bu fonksiyon bilinçli olarak hata fırlatır ki
 * projede nerede kullanılıyorsa yakalayabilelim.
 */
export function toLocalISOString(_: Date): never {
  throw new Error(
    "toLocalISOString is deprecated. Use toSqlLocalString instead."
  );
}

/**
 * ✅ DOĞRU YOL
 * JS Date → PostgreSQL local timestamp string
 * Format: YYYY-MM-DD HH:mm:ss
 *
 * - UTC yok
 * - ISO yok
 * - Timezone math yok
 */
export function toSqlLocalString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    `${d.getFullYear()}-` +
    `${pad(d.getMonth() + 1)}-` +
    `${pad(d.getDate())} ` +
    `${pad(d.getHours())}:` +
    `${pad(d.getMinutes())}:` +
    `${pad(d.getSeconds())}`
  );
}

/**
 * Haftanın başlangıcı (Pazartesi)
 * UI için güvenli, timezone problemi yok
 */
export function getStartOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);

  return d;
}
