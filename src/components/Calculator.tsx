import { useMemo, useState } from "react";
import { PAY_GAP, COUNTRY_CURRENCY } from "@/data/payGap";
import { ShareCard } from "./ShareCard";
import { equalPayDayFromGap, formatEPD, daysUnpaid } from "@/lib/equalPayDay";
import { getGapForYear, getNearestGap } from "@/lib/getGap";

interface Props {
  selectedIso2: string | null;
  onSelectIso: (iso: string) => void;
  year: number;
}

export function Calculator({ selectedIso2, onSelectIso, year }: Props) {
  const [salary, setSalary] = useState<number>(50000);

  const country = useMemo(
    () => PAY_GAP.find((p) => p.isoA2 === selectedIso2) ?? PAY_GAP.find((p) => p.isoA2 === "DE")!,
    [selectedIso2]
  );

  // Try the exact year first; fall back to the nearest available reference year
  const exact = getGapForYear(country.isoA2, year);
  const fallback = exact == null ? getNearestGap(country.isoA2, year) : null;
  const gap = exact ?? fallback?.gap ?? country.gap;
  const refYear = exact != null ? year : fallback?.year ?? country.year;
  const epdYear = year + 1;

  const currency = COUNTRY_CURRENCY[country.isoA2] ?? { code: "EUR", symbol: "€" };
  const womensEarnings = salary * (1 - gap / 100);
  const annualGap = salary - womensEarnings;
  const epd = equalPayDayFromGap(gap, epdYear);
  const epdLong = formatEPD(epd, { month: "long", day: "numeric" });
  const unpaid = daysUnpaid(gap, epdYear);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(n));

  return (
    <div className="space-y-6">
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

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Annual gross salary ({currency.code})
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-display text-2xl text-muted-foreground">
            {currency.symbol}
          </span>
          <input
            type="number"
            value={salary}
            onChange={(e) => setSalary(Math.max(0, Number(e.target.value) || 0))}
            className="w-full rounded-md border border-border bg-background py-3 pl-10 pr-3 font-display text-3xl focus:border-accent focus:outline-none"
          />
        </div>
        <input
          type="range"
          min={10000}
          max={250000}
          step={1000}
          value={salary}
          onChange={(e) => setSalary(Number(e.target.value))}
          className="mt-3 w-full accent-[var(--accent-magenta)]"
        />
      </div>

      <div className="rounded-lg border border-[var(--accent-magenta)]/30 bg-[var(--accent-magenta)]/5 p-5">
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
            <span className="block mt-1 text-xs italic">
              No data for {year}; using nearest year ({refYear}).
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-border pt-6">
        <Stat label="Pay gap" value={`${gap.toFixed(1)}%`} accent />
        <Stat label="Reference year" value={String(refYear)} />
        <Stat label="A man earns" value={`${currency.symbol}${fmt(salary)}`} />
        <Stat label="A woman earns" value={`${currency.symbol}${fmt(womensEarnings)}`} accent />
        <Stat label="Annual difference" value={`${currency.symbol}${fmt(annualGap)}`} />
        <Stat label="Days unpaid" value={`${unpaid} of 365`} />
      </div>

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
    </div>
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
