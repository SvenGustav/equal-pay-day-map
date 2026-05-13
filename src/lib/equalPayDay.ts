// Equal Pay Day = the date from which women effectively stop earning, relative to men.
// day_of_year = round(365 * (1 - gap/100)). Negative gaps clamp to Dec 31.
export function equalPayDayFromGap(gap: number, year = 2025): Date {
  const daysInYear = ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
  const dayOfYear = Math.min(daysInYear, Math.max(1, Math.round(daysInYear * (1 - gap / 100))));
  const d = new Date(year, 0, 1);
  d.setDate(dayOfYear);
  return d;
}

export function formatEPD(d: Date, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  return new Intl.DateTimeFormat("en-GB", opts).format(d);
}

export function daysUnpaid(gap: number, year = 2025): number {
  const daysInYear = ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
  return Math.max(0, Math.round((gap / 100) * daysInYear));
}
