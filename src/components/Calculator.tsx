import { useMemo, useState } from "react";
import { PAY_GAP } from "@/data/payGap";
import { COUNTRY_CURRENCY } from "@/data/payGap";
import { ShareCard } from "./ShareCard";

interface Props {
  selectedIso2: string | null;
  onSelectIso: (iso: string) => void;
}

export function Calculator({ selectedIso2, onSelectIso }: Props) {
  const [salary, setSalary] = useState<number>(50000);

  const entry = useMemo(
    () => PAY_GAP.find((p) => p.isoA2 === selectedIso2) ?? PAY_GAP.find((p) => p.isoA2 === "DE")!,
    [selectedIso2]
  );

  const currency = COUNTRY_CURRENCY[entry.isoA2] ?? { code: "EUR", symbol: "€" };
  const womensEarnings = salary * (1 - entry.gap / 100);
  const annualGap = salary - womensEarnings;
  const equalPayDay = Math.round((entry.gap / 100) * 365);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(n));

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Country
        </label>
        <select
          value={entry.isoA2}
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

      <div className="grid grid-cols-2 gap-3 border-t border-border pt-6">
        <Stat label="Pay gap" value={`${entry.gap.toFixed(1)}%`} accent />
        <Stat label="Reference year" value={String(entry.year)} />
        <Stat label="A man earns" value={`${currency.symbol}${fmt(salary)}`} />
        <Stat label="A woman earns" value={`${currency.symbol}${fmt(womensEarnings)}`} accent />
        <Stat label="Annual difference" value={`${currency.symbol}${fmt(annualGap)}`} />
        <Stat
          label="Equal pay day"
          value={equalPayDay > 0 ? `${equalPayDay} days unpaid` : "Reached"}
        />
      </div>

      <ShareCard
        country={entry.country}
        gap={entry.gap}
        year={entry.year}
        salary={salary}
        womensEarnings={womensEarnings}
        annualGap={annualGap}
        currency={currency.symbol}
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
