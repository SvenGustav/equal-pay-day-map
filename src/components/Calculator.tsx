import { useMemo } from "react";
import { PAY_GAP, COUNTRY_CURRENCY } from "@/data/payGap";
import { ShareCard } from "./ShareCard";
import { HistoryChart } from "./HistoryChart";
import { equalPayDayFromGap, formatEPD, daysUnpaid } from "@/lib/equalPayDay";
import { getGapForYear, getNearestGap } from "@/lib/getGap";

interface BaseProps {
  selectedIso2: string | null;
  year: number;
}

function useCountryData({ selectedIso2, year }: BaseProps) {
  const country = useMemo(
    () => PAY_GAP.find((p) => p.isoA2 === selectedIso2) ?? PAY_GAP.find((p) => p.isoA2 === "DE")!,
    [selectedIso2]
  );
  const exact = getGapForYear(country.isoA2, year);
  const fallback = exact == null ? getNearestGap(country.isoA2, year) : null;
  const gap = exact ?? fallback?.gap ?? country.gap;
  const refYear = exact != null ? year : fallback?.year ?? country.year;
  const epdYear = year + 1;
  const currency = COUNTRY_CURRENCY[country.isoA2] ?? { code: "EUR", symbol: "€" };
  const epd = equalPayDayFromGap(gap, epdYear);
  const epdLong = formatEPD(epd, { month: "long", day: "numeric" });
  const unpaid = daysUnpaid(gap, epdYear);
  return { country, gap, refYear, epdYear, currency, epdLong, unpaid, exact };
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(n));

/** Top-right panel: country selector, EPD headline, history chart. */
export function CountrySummary({
  selectedIso2,
  onSelectIso,
  year,
}: BaseProps & { onSelectIso: (iso: string) => void }) {
  const { country, refYear, epdYear, epdLong, unpaid, exact } = useCountryData({
    selectedIso2,
    year,
  });

  return (
    <div className="flex h-full flex-col space-y-5">
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Country
        </label>
        <select
          value={country.isoA2}
          onChange={(e) => onSelectIso(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-display text-2xl focus:border-accent focus:outline-none"
        >
          {[...PAY_GAP]
            .sort((a, b) => a.country.localeCompare(b.country))
            .map((c) => (
              <option key={c.isoA2} value={c.isoA2}>
                {c.country}
              </option>
            ))}
        </select>
      </div>

      <div className="flex-1 rounded-lg border border-[var(--accent-magenta)]/30 bg-[var(--accent-magenta)]/5 p-5">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-magenta)]">
          Equal Pay Day · {epdYear}
        </div>
        <div className="mt-1 font-display text-5xl leading-none text-foreground">
          {epdLong}
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          The date in {epdYear} by which the average woman in {country.country} has
          worked enough to match what the average man earned in {year} —{" "}
          <span className="font-semibold text-foreground">{unpaid} days</span>{" "}
          into the year.
          {exact == null && (
            <span className="mt-1 block text-xs italic">
              No data for {year}; using nearest year ({refYear}).
            </span>
          )}
        </div>

        <div className="mt-5 border-t border-[var(--accent-magenta)]/20 pt-4">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-magenta)]/80">
            History · hover to inspect
          </div>
          <HistoryChart iso2={country.isoA2} highlightYear={refYear} />
        </div>
      </div>
    </div>
  );
}

/** Bottom-left panel: salary input + stats grid. */
export function SalaryCalculator({
  selectedIso2,
  year,
  salary,
  onSalaryChange,
}: BaseProps & { salary: number; onSalaryChange: (n: number) => void }) {
  const { country, gap, refYear, currency, unpaid } = useCountryData({ selectedIso2, year });
  const womensEarnings = salary * (1 - gap / 100);
  const annualGap = salary - womensEarnings;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Your salary in {country.country}
        </div>
        <label className="mt-2 block text-xs text-muted-foreground">
          Annual gross salary ({currency.code})
        </label>
        <div className="relative mt-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-display text-2xl text-muted-foreground">
            {currency.symbol}
          </span>
          <input
            type="number"
            value={salary}
            onChange={(e) => onSalaryChange(Math.max(0, Number(e.target.value) || 0))}
            className="w-full rounded-md border border-border bg-background py-3 pl-10 pr-3 font-display text-3xl focus:border-accent focus:outline-none"
          />
        </div>
        <input
          type="range"
          min={10000}
          max={250000}
          step={1000}
          value={salary}
          onChange={(e) => onSalaryChange(Number(e.target.value))}
          className="mt-3 w-full accent-[var(--accent-magenta)]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Pay gap" value={`${gap.toFixed(1)}%`} accent />
        <Stat label="Reference year" value={String(refYear)} />
        <Stat label="Days unpaid" value={`${unpaid} of 365`} />
        <Stat label="A man earns" value={`${currency.symbol}${fmt(salary)}`} />
        <Stat label="A woman earns" value={`${currency.symbol}${fmt(womensEarnings)}`} accent />
        <Stat label="Annual difference" value={`${currency.symbol}${fmt(annualGap)}`} />
      </div>
    </div>
  );
}

/** Bottom-right panel: shareable card. */
export function ShareablePanel({
  selectedIso2,
  year,
  salary,
}: BaseProps & { salary: number }) {
  const { country, gap, refYear, currency, epdLong, unpaid } = useCountryData({
    selectedIso2,
    year,
  });
  const womensEarnings = salary * (1 - gap / 100);
  const annualGap = salary - womensEarnings;

  return (
    <ShareCard
      country={country.country}
      iso2={country.isoA2}
      gap={gap}
      year={refYear}
      salary={salary}
      womensEarnings={womensEarnings}
      annualGap={annualGap}
      currency={currency.symbol}
      equalPayDay={epdLong}
      daysUnpaid={unpaid}
    />
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-background/60 px-3 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 font-display text-2xl ${accent ? "text-[var(--accent-magenta)]" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
