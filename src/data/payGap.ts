export interface PayGapEntry {
  country: string;
  isoA2: string;
  isoA3: string;
  year: number;
  gap: number; // percentage
}

// Latest available unadjusted gender pay gap per country (Eurostat TESEM180).
// Negative values mean women earn slightly more on average.
export const PAY_GAP: PayGapEntry[] = [
  { country: "Albania", isoA2: "AL", isoA3: "ALB", year: 2018, gap: 6.8 },
  { country: "Austria", isoA2: "AT", isoA3: "AUT", year: 2024, gap: 17.6 },
  { country: "Belgium", isoA2: "BE", isoA3: "BEL", year: 2024, gap: 0.7 },
  { country: "Bulgaria", isoA2: "BG", isoA3: "BGR", year: 2024, gap: 12.0 },
  { country: "Croatia", isoA2: "HR", isoA3: "HRV", year: 2024, gap: 6.6 },
  { country: "Cyprus", isoA2: "CY", isoA3: "CYP", year: 2024, gap: 11.8 },
  { country: "Czechia", isoA2: "CZ", isoA3: "CZE", year: 2024, gap: 18.5 },
  { country: "Denmark", isoA2: "DK", isoA3: "DNK", year: 2024, gap: 14.0 },
  { country: "Estonia", isoA2: "EE", isoA3: "EST", year: 2024, gap: 18.8 },
  { country: "Finland", isoA2: "FI", isoA3: "FIN", year: 2024, gap: 16.3 },
  { country: "France", isoA2: "FR", isoA3: "FRA", year: 2024, gap: 11.8 },
  { country: "Germany", isoA2: "DE", isoA3: "DEU", year: 2024, gap: 15.6 },
  { country: "Greece", isoA2: "GR", isoA3: "GRC", year: 2024, gap: 13.4 },
  { country: "Hungary", isoA2: "HU", isoA3: "HUN", year: 2024, gap: 16.9 },
  { country: "Iceland", isoA2: "IS", isoA3: "ISL", year: 2024, gap: 11.1 },
  { country: "Ireland", isoA2: "IE", isoA3: "IRL", year: 2024, gap: 8.3 },
  { country: "Italy", isoA2: "IT", isoA3: "ITA", year: 2024, gap: 5.3 },
  { country: "Latvia", isoA2: "LV", isoA3: "LVA", year: 2024, gap: 13.9 },
  { country: "Lithuania", isoA2: "LT", isoA3: "LTU", year: 2024, gap: 10.0 },
  { country: "Luxembourg", isoA2: "LU", isoA3: "LUX", year: 2024, gap: -0.8 },
  { country: "Malta", isoA2: "MT", isoA3: "MLT", year: 2024, gap: 4.9 },
  { country: "Montenegro", isoA2: "ME", isoA3: "MNE", year: 2014, gap: 7.7 },
  { country: "Netherlands", isoA2: "NL", isoA3: "NLD", year: 2024, gap: 11.2 },
  { country: "North Macedonia", isoA2: "MK", isoA3: "MKD", year: 2014, gap: 9.1 },
  { country: "Norway", isoA2: "NO", isoA3: "NOR", year: 2024, gap: 13.0 },
  { country: "Poland", isoA2: "PL", isoA3: "POL", year: 2024, gap: 4.0 },
  { country: "Portugal", isoA2: "PT", isoA3: "PRT", year: 2024, gap: 7.0 },
  { country: "Romania", isoA2: "RO", isoA3: "ROU", year: 2024, gap: 3.7 },
  { country: "Serbia", isoA2: "RS", isoA3: "SRB", year: 2018, gap: 9.6 },
  { country: "Slovakia", isoA2: "SK", isoA3: "SVK", year: 2024, gap: 15.7 },
  { country: "Slovenia", isoA2: "SI", isoA3: "SVN", year: 2024, gap: 8.0 },
  { country: "Spain", isoA2: "ES", isoA3: "ESP", year: 2024, gap: 7.3 },
  { country: "Sweden", isoA2: "SE", isoA3: "SWE", year: 2024, gap: 11.2 },
  { country: "Switzerland", isoA2: "CH", isoA3: "CHE", year: 2024, gap: 16.0 },
  { country: "Türkiye", isoA2: "TR", isoA3: "TUR", year: 2014, gap: -1.3 },
  { country: "United Kingdom", isoA2: "GB", isoA3: "GBR", year: 2018, gap: 19.8 },
];

export const COUNTRY_CURRENCY: Record<string, { code: string; symbol: string }> = {
  AL: { code: "ALL", symbol: "L" }, AT: { code: "EUR", symbol: "€" },
  BE: { code: "EUR", symbol: "€" }, BG: { code: "BGN", symbol: "лв" },
  HR: { code: "EUR", symbol: "€" }, CY: { code: "EUR", symbol: "€" },
  CZ: { code: "CZK", symbol: "Kč" }, DK: { code: "DKK", symbol: "kr" },
  EE: { code: "EUR", symbol: "€" }, FI: { code: "EUR", symbol: "€" },
  FR: { code: "EUR", symbol: "€" }, DE: { code: "EUR", symbol: "€" },
  GR: { code: "EUR", symbol: "€" }, HU: { code: "HUF", symbol: "Ft" },
  IS: { code: "ISK", symbol: "kr" }, IE: { code: "EUR", symbol: "€" },
  IT: { code: "EUR", symbol: "€" }, LV: { code: "EUR", symbol: "€" },
  LT: { code: "EUR", symbol: "€" }, LU: { code: "EUR", symbol: "€" },
  MT: { code: "EUR", symbol: "€" }, ME: { code: "EUR", symbol: "€" },
  NL: { code: "EUR", symbol: "€" }, MK: { code: "MKD", symbol: "ден" },
  NO: { code: "NOK", symbol: "kr" }, PL: { code: "PLN", symbol: "zł" },
  PT: { code: "EUR", symbol: "€" }, RO: { code: "RON", symbol: "lei" },
  RS: { code: "RSD", symbol: "дин" }, SK: { code: "EUR", symbol: "€" },
  SI: { code: "EUR", symbol: "€" }, ES: { code: "EUR", symbol: "€" },
  SE: { code: "SEK", symbol: "kr" }, CH: { code: "CHF", symbol: "Fr" },
  TR: { code: "TRY", symbol: "₺" }, GB: { code: "GBP", symbol: "£" },
};
