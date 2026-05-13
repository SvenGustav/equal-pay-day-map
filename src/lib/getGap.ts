import { HISTORICAL_GAP, HISTORICAL_YEARS } from "@/data/historicalGap";

export const MIN_YEAR = HISTORICAL_YEARS[0];
export const MAX_YEAR = HISTORICAL_YEARS[HISTORICAL_YEARS.length - 1];

/**
 * Returns the pay gap for the requested year, or null if no data.
 * Strict: only returns a value when that exact year is available
 * (so sparse-data countries gray out, which is informative).
 */
export function getGapForYear(iso2: string, year: number): number | null {
  const series = HISTORICAL_GAP[iso2];
  if (!series) return null;
  const v = series[year];
  return typeof v === "number" ? v : null;
}

/** Latest available year ≤ requested year, for "best effort" lookups. */
export function getNearestGap(
  iso2: string,
  year: number
): { gap: number; year: number } | null {
  const series = HISTORICAL_GAP[iso2];
  if (!series) return null;
  const years = Object.keys(series)
    .map(Number)
    .sort((a, b) => a - b);
  let best: number | null = null;
  for (const y of years) {
    if (y <= year) best = y;
  }
  if (best == null) return null;
  return { gap: series[best], year: best };
}
