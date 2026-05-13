import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { EuropeMap } from "@/components/EuropeMap";
import { CountrySummary, SalaryCalculator, ShareablePanel } from "@/components/Calculator";
import { MIN_YEAR, MAX_YEAR } from "@/lib/getGap";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "The Unpaid Year — EU Gender Pay Gap, Visualised" },
      {
        name: "description",
        content:
          "An interactive choropleth of the EU gender pay gap from 2007 to 2024. Slide through the years, map your salary against the gap, and download a shareable card.",
      },
    ],
  }),
});

function Index() {
  const [selected, setSelected] = useState<string | null>("DE");
  const [year, setYear] = useState<number>(MAX_YEAR);
  const [salary, setSalary] = useState<number>(50000);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-2xl">paygap.eu</span>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Eurostat · TESEM180
            </span>
          </div>
          <a
            href="https://ec.europa.eu/eurostat/databrowser/view/tesem180/default/table"
            target="_blank"
            rel="noreferrer"
            className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Source ↗
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pt-16 pb-10">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent-magenta)]">
            Equal Pay Day · Europe {year + 1}
          </div>
          <h1 className="mt-4 font-display text-6xl leading-[0.95] sm:text-7xl">
            How far into {year + 1} must women work{" "}
            <em className="text-[var(--accent-magenta)]">to match what men earned in {year}</em>?
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Each country is labelled with its{" "}
            <strong className="text-foreground">Equal Pay Day</strong> — the
            calendar date in {year + 1} by which the average woman has worked
            enough to catch up with what the average man earned the year before.
            Drag the slider to scrub through {MIN_YEAR}–{MAX_YEAR}.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-8">
        <YearSlider year={year} onChange={setYear} />
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 pb-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-border bg-background/50 p-2">
          <EuropeMap selectedIso2={selected} onSelect={setSelected} year={year} />
        </div>
        <div className="rounded-xl border border-border bg-secondary/40 p-6">
          <CountrySummary selectedIso2={selected} onSelectIso={setSelected} year={year} />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 pb-24 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-secondary/40 p-6">
          <SalaryCalculator
            selectedIso2={selected}
            year={year}
            salary={salary}
            onSalaryChange={setSalary}
          />
        </div>
        <div className="rounded-xl border border-border bg-background/50 p-6">
          <ShareablePanel selectedIso2={selected} year={year} salary={salary} />
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-6 text-xs text-muted-foreground">
          Data: Eurostat, unadjusted gender pay gap (TESEM180), {MIN_YEAR}–{MAX_YEAR}.
          Negative values mean women earn slightly more on average. Countries
          without data for the selected year are shown in gray.
        </div>
      </footer>
    </main>
  );
}

function YearSlider({
  year,
  onChange,
}: {
  year: number;
  onChange: (y: number) => void;
}) {
  const years: number[] = [];
  for (let y = MIN_YEAR; y <= MAX_YEAR; y++) years.push(y);

  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-5">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
            Reference year
          </div>
          <div className="font-display text-5xl leading-none text-[var(--accent-magenta)]">
            {year}
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          Equal Pay Day computed for{" "}
          <span className="font-semibold text-foreground">{year + 1}</span>
        </div>
      </div>

      <input
        type="range"
        min={MIN_YEAR}
        max={MAX_YEAR}
        step={1}
        value={year}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-4 w-full accent-[var(--accent-magenta)]"
        aria-label="Reference year"
      />

      <div className="mt-2 flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
        {years
          .filter((y) => y % 2 === (MIN_YEAR % 2))
          .map((y) => (
            <button
              key={y}
              onClick={() => onChange(y)}
              className={`tabular-nums transition-colors ${
                y === year ? "text-[var(--accent-magenta)] font-bold" : "hover:text-foreground"
              }`}
            >
              {y}
            </button>
          ))}
      </div>
    </div>
  );
}
