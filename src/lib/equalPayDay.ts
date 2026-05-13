// Equal Pay Day convention (BPW / IWD):
// The date in the new year by which women have to work to earn what men
// earned in the *previous* year. days_into_year = round(365 * gap/100).
export function equalPayDayFromGap(gap: number, year = 2026): Date {
  const daysInYear = ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
  const offset = Math.max(0, Math.round(daysInYear * (gap / 100)));
  const d = new Date(year, 0, 1);
  d.setDate(1 + offset);
  return d;
}

export function formatEPD(d: Date, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  return new Intl.DateTimeFormat("en-GB", opts).format(d);
}

export function daysUnpaid(gap: number, year = 2026): number {
  const daysInYear = ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
  return Math.max(0, Math.round((gap / 100) * daysInYear));
}
