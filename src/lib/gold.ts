// Gold/precious metals utilities for purity, weight, and rate calculations

export const TOLA_TO_GRAM = 11.664;
export const RATTI_PER_GRAM = 8;

export interface KaratEntry {
  density: number;
  karat: number;
}

// Calibrated density → karat lookup table.
// Do NOT use linear formula — gold alloys vary; use nearest-match lookup only.
export const KARAT_TABLE: KaratEntry[] = [
  { density: 6.5, karat: 6 },
  { density: 7.0, karat: 8 },
  { density: 8.0, karat: 10 },
  { density: 9.0, karat: 12 },
  { density: 10.5, karat: 14 },
  { density: 12.0, karat: 16 },
  { density: 14.0, karat: 18 },
  { density: 16.5, karat: 20 },
  { density: 17.5, karat: 22 },
  { density: 19.3, karat: 24 },
];

export function nearestKarat(density: number): KaratEntry {
  return KARAT_TABLE.reduce((best, entry) =>
    Math.abs(density - entry.density) < Math.abs(density - best.density) ? entry : best
  );
}

export function fineWeight(grossWeight: number, karat: number): number {
  return Number((grossWeight * (karat / 24)).toFixed(4));
}

export function tolaRateForKarat(tola24k: number, karat: number): number {
  return Number((tola24k * (karat / 24)).toFixed(0));
}

export function purityPercent(karat: number): number {
  return Number(((karat / 24) * 100).toFixed(2));
}

// Sort gold rates so the truly latest entry comes first:
// by date, then time-of-day, then insertion time (created_at).
export function sortRatesLatestFirst<T extends { rate_date?: string; rate_time?: string | null; created_at?: string }>(rates: T[]): T[] {
  return [...rates].sort((a, b) => {
    if ((a.rate_date || "") !== (b.rate_date || "")) return (a.rate_date || "") < (b.rate_date || "") ? 1 : -1;
    if ((a.rate_time || "") !== (b.rate_time || "")) return (a.rate_time || "") < (b.rate_time || "") ? 1 : -1;
    return (a.created_at || "") < (b.created_at || "") ? 1 : -1;
  });
}

export function getLatestRate<T extends { rate_date?: string; rate_time?: string | null; created_at?: string }>(rates: T[]): T | undefined {
  return sortRatesLatestFirst(rates)[0];
}

// "14:30" -> "2:30 PM" label; returns "" if no time
export function formatRateTime(time?: string | null): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}
