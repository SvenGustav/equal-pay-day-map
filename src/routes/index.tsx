import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { EuropeMap } from "@/components/EuropeMap";
import { Calculator } from "@/components/Calculator";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "The Unpaid Year — EU Gender Pay Gap, Visualised" },
      {
        name: "description",
        content:
          "An interactive choropleth of the EU gender pay gap. Map your salary against the gap in each country and download a shareable card.",
      },
    ],
  }),
});

function Index() {
  const [selected, setSelected] = useState<string | null>("DE");

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
            The Unpaid Year
          </div>
          <h1 className="mt-4 font-display text-6xl leading-[0.95] sm:text-7xl">
            How much of the year does a woman in Europe work{" "}
            <em className="text-[var(--accent-magenta)]">for free</em>?
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
            The unadjusted gender pay gap measures the difference between average
            gross hourly earnings of male and female employees as a percentage of
            male earnings. Hover or tap a country, then dial in a salary to see
            what the gap looks like in cash.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 pb-24 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-border bg-background/50 p-2">
          <EuropeMap selectedIso2={selected} onSelect={setSelected} />
        </div>
        <div className="rounded-xl border border-border bg-secondary/40 p-6">
          <Calculator selectedIso2={selected} onSelectIso={setSelected} />
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-6 text-xs text-muted-foreground">
          Data: Eurostat, unadjusted gender pay gap (TESEM180), latest year
          available per country. Negative values mean women earn slightly more
          on average.
        </div>
      </footer>
    </main>
  );
}
