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

// Colorblind-aware sequential ramp (yellow → orange → magenta).
// Strong hue separation works for both deuteranopia and protanopia.
const COLOR_STOPS = {
  domain: [0, 15, 35, 60, 90],
  range: [
    "oklch(0.95 0.05 95)",   // pale yellow
    "oklch(0.85 0.15 75)",   // warm yellow
    "oklch(0.72 0.20 45)",   // orange
    "oklch(0.58 0.24 15)",   // red-orange
    "oklch(0.42 0.22 350)",  // deep magenta
  ],
};

const NO_DATA_FILL = "url(#no-data-pattern)";

function makeColorScale() {
  return scaleLinear<string>()
    .domain(COLOR_STOPS.domain)
    .range(COLOR_STOPS.range)
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

  const labels = useMemo(() => {
    if (!geo) return [];
    return geo.features
      .map((f: any) => {
        const iso2 = f.properties.ISO2;
        const gap = getGapForYear(iso2, year);
        if (gap == null) return null;
        const [cx, cy] = pathGen.centroid(f);
        if (!isFinite(cx) || !isFinite(cy)) return null;
        const epd = equalPayDayFromGap(gap, epdYear);
        const area = pathGen.area(f);
        return {
          iso2,
          cx,
          cy,
          area,
          name: nameByIso.get(iso2) ?? iso2,
          gap,
          epdShort: formatEPD(epd),
        };
      })
      .filter(Boolean) as Array<{
        iso2: string; cx: number; cy: number; area: number;
        name: string; gap: number; epdShort: string;
      }>;
  }, [geo, nameByIso, pathGen, year, epdYear]);

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
        <defs>
          <pattern
            id="no-data-pattern"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="6" height="6" fill="oklch(0.93 0.005 85)" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="oklch(0.82 0.005 85)" strokeWidth="1.2" />
          </pattern>
          <filter id="label-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0.6" stdDeviation="0.8" floodOpacity="0.18" />
          </filter>
        </defs>

        <g>
          {geo.features.map((f: any) => {
            const iso2 = f.properties.ISO2;
            const gap = getGapForYear(iso2, year);
            const days = gap != null ? daysUnpaid(gap, epdYear) : 0;
            const fill = gap != null ? colorScale(days) : NO_DATA_FILL;
            const isSelected = selectedIso2 === iso2;
            const d = pathGen(f) ?? "";
            const country = nameByIso.get(iso2) ?? iso2;
            return (
              <path
                key={f.properties.FID ?? iso2}
                d={d}
                fill={fill}
                stroke={isSelected ? "var(--accent-magenta)" : "oklch(0.99 0.003 85)"}
                strokeWidth={isSelected ? 2.6 : 0.7}
                className={
                  gap != null
                    ? "cursor-pointer transition-[opacity,stroke-width] hover:opacity-85 focus:outline-none"
                    : ""
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

        {/* Country labels — ISO code + EPD date, sized by country area */}
        <g pointerEvents="none">
          {labels
            .filter((l) => l.area > 220)
            .map((l) => {
              const big = l.area > 1500;
              const fontDate = big ? 13 : 11;
              const fontIso = big ? 9 : 8;
              const w = big ? 56 : 46;
              const h = big ? 30 : 26;
              return (
                <g key={l.iso2} transform={`translate(${l.cx}, ${l.cy})`}>
                  <rect
                    x={-w / 2}
                    y={-h / 2}
                    width={w}
                    height={h}
                    rx={4}
                    fill="oklch(1 0 0)"
                    fillOpacity={0.95}
                    stroke="oklch(0.15 0.02 50 / 0.25)"
                    strokeWidth={0.5}
                    filter="url(#label-shadow)"
                  />
                  <text
                    textAnchor="middle"
                    y={-2}
                    style={{
                      fontSize: fontIso,
                      fill: "oklch(0.45 0.02 50)",
                      letterSpacing: "0.12em",
                      fontWeight: 700,
                    }}
                  >
                    {l.iso2}
                  </text>
                  <text
                    textAnchor="middle"
                    y={11}
                    className="font-display"
                    style={{
                      fontSize: fontDate,
                      fill: "oklch(0.18 0.02 50)",
                      letterSpacing: "-0.01em",
                      fontWeight: 600,
                    }}
                  >
                    {l.epdShort}
                  </text>
                </g>
              );
            })}
        </g>
      </svg>

      {hover && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 rounded-md border border-border bg-background px-3 py-2 text-xs shadow-lg"
          style={{ left: hover.x + 14, top: hover.y + 14 }}
        >
          <div className="font-display text-base leading-none">{hover.name}</div>
          <div className="mt-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
            Equal Pay Day {epdYear}
          </div>
          <div className="font-display text-xl text-[var(--accent-magenta)]">{hover.epd}</div>
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
  const scale = makeColorScale();
  // Use a continuous gradient bar with explicit tick labels mapped to dates.
  const ticks = [
    { d: 0, label: "Jan 1", sub: "0%" },
    { d: 31, label: "Feb 1", sub: "~8%" },
    { d: 59, label: "Mar 1", sub: "~16%" },
    { d: 90, label: "Apr 1", sub: "~25%" },
  ];
  // Build gradient from the same scale samples
  const samples = Array.from({ length: 12 }, (_, i) => {
    const t = (i / 11) * 90;
    return `${scale(t)} ${(i / 11) * 100}%`;
  });
  const gradient = `linear-gradient(to right, ${samples.join(", ")})`;

  return (
    <div className="absolute bottom-3 left-3 right-3 max-w-[420px] rounded-lg border border-border bg-background/95 px-4 py-3 text-[10px] shadow-md backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold uppercase tracking-widest text-foreground">
          Equal Pay Day
        </span>
        <span className="text-muted-foreground">earlier ← → later</span>
      </div>
      <div
        className="h-3 w-full rounded-sm border border-border/60"
        style={{ background: gradient }}
        aria-hidden
      />
      <div className="mt-1.5 flex justify-between text-muted-foreground">
        {ticks.map((t) => (
          <div key={t.d} className="flex flex-col items-start">
            <span className="font-semibold text-foreground">{t.label}</span>
            <span>{t.sub}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 border-t border-border pt-2 text-muted-foreground">
        <span
          className="inline-block h-3 w-5 rounded-sm border border-border/60"
          style={{
            background:
              "repeating-linear-gradient(45deg, oklch(0.93 0.005 85) 0 2px, oklch(0.82 0.005 85) 2px 3px)",
          }}
          aria-hidden
        />
        <span>No data for the selected year</span>
      </div>
    </div>
  );
}
