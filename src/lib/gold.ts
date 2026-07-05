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
