import { useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { scaleLinear } from "d3-scale";
import europe from "@/data/europe.geojson?url";
import { useQuery } from "@tanstack/react-query";
import { PAY_GAP } from "@/data/payGap";
import { equalPayDayFromGap, formatEPD, daysUnpaid } from "@/lib/equalPayDay";
import { getGapForYear } from "@/lib/getGap";

interface Props {
  selectedIso2: string | null;
  onSelect: (iso2: string) => void;
  year: number;
}

const WIDTH = 760;
const HEIGHT = 720;

function makeColorScale() {
  return scaleLinear<string>()
    .domain([0, 30, 75])
    .range(["oklch(0.94 0.03 90)", "oklch(0.75 0.18 30)", "oklch(0.42 0.24 10)"])
    .clamp(true);
}

export function EuropeMap({ selectedIso2, onSelect, year }: Props) {
  const [hover, setHover] = useState<{
    x: number; y: number; name: string; gap: number; year: number; epd: string; days: number;
  } | null>(null);

  const { data: geo } = useQuery({
    queryKey: ["europe-geo"],
    queryFn: async () => (await fetch(europe)).json(),
    staleTime: Infinity,
  });

  const nameByIso = useMemo(() => {
    const m = new Map<string, string>();
    PAY_GAP.forEach((d) => m.set(d.isoA2, d.country));
    return m;
  }, []);

  const epdYear = year + 1;
  const colorScale = useMemo(makeColorScale, []);

  const projection = useMemo(
    () => geoMercator().center([15, 54]).scale(620).translate([WIDTH / 2, HEIGHT / 2]),
    []
  );
  const pathGen = useMemo(() => geoPath(projection), [projection]);

  if (!geo) {
    return (
      <div className="flex h-[720px] items-center justify-center text-sm text-muted-foreground">
        Loading map…
      </div>
    );
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Choropleth map of Europe showing Equal Pay Day ${epdYear} for each country, based on the ${year} gender pay gap.`}
      >
        <g>
          {geo.features.map((f: any) => {
            const iso2 = f.properties.ISO2;
            const gap = getGapForYear(iso2, year);
            const days = gap != null ? daysUnpaid(gap, epdYear) : 0;
            const fill = gap != null ? colorScale(days) : "oklch(0.9 0.005 85)";
            const isSelected = selectedIso2 === iso2;
            const d = pathGen(f) ?? "";
            const country = nameByIso.get(iso2) ?? iso2;
            return (
              <path
                key={f.properties.FID ?? iso2}
                d={d}
                fill={fill}
                stroke={isSelected ? "var(--accent-magenta)" : "oklch(0.97 0.005 85)"}
                strokeWidth={isSelected ? 2.4 : 0.6}
                className={
                  gap != null
                    ? "cursor-pointer transition-opacity hover:opacity-80 focus:outline-none"
                    : "opacity-40"
                }
                tabIndex={gap != null ? 0 : -1}
                onFocus={() => gap != null && onSelect(iso2)}
                onMouseMove={(e) => {
                  if (gap == null) return;
                  const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  const epd = equalPayDayFromGap(gap, epdYear);
                  setHover({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                    name: country,
                    gap,
                    year,
                    epd: formatEPD(epd, { month: "long", day: "numeric" }),
                    days: daysUnpaid(gap, epdYear),
                  });
                }}
                onMouseLeave={() => setHover(null)}
                onClick={() => gap != null && onSelect(iso2)}
              >
                <title>
                  {country}
                  {gap != null
                    ? ` — Equal Pay Day ${epdYear}: ${formatEPD(equalPayDayFromGap(gap, epdYear), { month: "long", day: "numeric" })} (${gap.toFixed(1)}% gap)`
                    : " — no data for this year"}
                </title>
              </path>
            );
          })}
        </g>
      </svg>

      {hover && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 rounded-md border border-border bg-background px-3 py-2 text-sm shadow-lg"
          style={{ left: hover.x + 14, top: hover.y + 14 }}
        >
          <div className="font-display text-lg leading-none">{hover.name}</div>
          <div className="mt-1.5 text-xs uppercase tracking-widest text-muted-foreground">
            Equal Pay Day {epdYear}
          </div>
          <div className="font-display text-2xl text-[var(--accent-magenta)]">{hover.epd}</div>
          <div className="mt-1 text-muted-foreground">
            {hover.days} days unpaid · {hover.gap.toFixed(1)}% gap · ref. {hover.year}
          </div>
        </div>
      )}

      <Legend />
    </div>
  );
}

function Legend() {
  const stops = [0, 15, 30, 45, 60, 75];
  const scale = makeColorScale();
  return (
    <div className="absolute bottom-2 left-2 rounded-md border border-border bg-background/90 px-3 py-2 text-xs backdrop-blur">
      <div className="mb-1 uppercase tracking-widest text-muted-foreground">
        Days women work unpaid
      </div>
      <div className="flex items-center gap-1">
        {stops.map((s) => (
          <div key={s} className="flex flex-col items-center gap-1">
            <div className="h-3 w-8" style={{ background: scale(s) }} aria-hidden />
            <span>{s}d</span>
          </div>
        ))}
      </div>
    </div>
  );
}
