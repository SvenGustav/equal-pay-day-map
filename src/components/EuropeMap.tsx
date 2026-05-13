import { useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { scaleLinear } from "d3-scale";
import europe from "@/data/europe.geojson?url";
import { useQuery } from "@tanstack/react-query";
import { PAY_GAP } from "@/data/payGap";
import { equalPayDayFromGap, formatEPD, daysUnpaid } from "@/lib/equalPayDay";

interface Props {
  selectedIso2: string | null;
  onSelect: (iso2: string) => void;
}

const WIDTH = 760;
const HEIGHT = 720;
const LABEL_YEAR = 2026;

export function EuropeMap({ selectedIso2, onSelect }: Props) {
  const [hover, setHover] = useState<{
    x: number; y: number; name: string; gap: number; year: number; epd: string; days: number;
  } | null>(null);

  const { data: geo } = useQuery({
    queryKey: ["europe-geo"],
    queryFn: async () => (await fetch(europe)).json(),
    staleTime: Infinity,
  });

  const gapByIso = useMemo(() => {
    const m = new Map<string, (typeof PAY_GAP)[number]>();
    PAY_GAP.forEach((d) => m.set(d.isoA2, d));
    return m;
  }, []);

  // Color by days unpaid: 0 days = soft, 75+ days = deep magenta
  const colorScale = useMemo(
    () =>
      scaleLinear<string>()
        .domain([0, 30, 75])
        .range(["oklch(0.94 0.03 90)", "oklch(0.75 0.18 30)", "oklch(0.42 0.24 10)"])
        .clamp(true),
    []
  );

  const projection = useMemo(
    () => geoMercator().center([15, 54]).scale(620).translate([WIDTH / 2, HEIGHT / 2]),
    []
  );
  const pathGen = useMemo(() => geoPath(projection), [projection]);

  // Pre-compute centroids + dates for label layer
  const labels = useMemo(() => {
    if (!geo) return [];
    return geo.features
      .map((f: any) => {
        const iso2 = f.properties.ISO2;
        const entry = gapByIso.get(iso2);
        if (!entry) return null;
        const [cx, cy] = pathGen.centroid(f);
        if (!isFinite(cx) || !isFinite(cy)) return null;
        const epd = equalPayDayFromGap(entry.gap, LABEL_YEAR);
        const area = pathGen.area(f);
        return {
          iso2,
          cx,
          cy,
          area,
          name: entry.country,
          gap: entry.gap,
          epdShort: formatEPD(epd),
        };
      })
      .filter(Boolean) as Array<{
        iso2: string; cx: number; cy: number; area: number;
        name: string; gap: number; epdShort: string;
      }>;
  }, [geo, gapByIso, pathGen]);

  if (!geo) {
    return (
      <div className="flex h-[720px] items-center justify-center text-sm text-muted-foreground">
        Loading map…
      </div>
    );
  }

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full">
        <defs>
          <filter id="label-bg" x="-10%" y="-15%" width="120%" height="130%">
            <feFlood floodColor="oklch(0.97 0.005 85)" floodOpacity="0.92" />
            <feComposite in="SourceGraphic" operator="over" />
          </filter>
        </defs>

        <g>
          {geo.features.map((f: any) => {
            const iso2 = f.properties.ISO2;
            const entry = gapByIso.get(iso2);
            const days = entry ? daysUnpaid(entry.gap, LABEL_YEAR) : 0;
            const fill = entry ? colorScale(days) : "oklch(0.9 0.005 85)";
            const isSelected = selectedIso2 === iso2;
            const d = pathGen(f) ?? "";
            return (
              <path
                key={f.properties.FID ?? iso2}
                d={d}
                fill={fill}
                stroke={isSelected ? "var(--accent-magenta)" : "oklch(0.97 0.005 85)"}
                strokeWidth={isSelected ? 2.4 : 0.6}
                className={entry ? "cursor-pointer transition-opacity hover:opacity-80" : "opacity-40"}
                onMouseMove={(e) => {
                  if (!entry) return;
                  const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  const epd = equalPayDayFromGap(entry.gap, LABEL_YEAR);
                  setHover({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                    name: entry.country,
                    gap: entry.gap,
                    year: entry.year,
                    epd: formatEPD(epd, { month: "long", day: "numeric" }),
                    days: daysUnpaid(entry.gap, LABEL_YEAR),
                  });
                }}
                onMouseLeave={() => setHover(null)}
                onClick={() => entry && onSelect(iso2)}
              />
            );
          })}
        </g>

        {/* Equal Pay Day labels — only for countries large enough to fit text */}
        <g pointerEvents="none">
          {labels
            .filter((l) => l.area > 280)
            .map((l) => (
              <g key={l.iso2} transform={`translate(${l.cx}, ${l.cy})`}>
                <rect
                  x={-22}
                  y={-9}
                  width={44}
                  height={18}
                  rx={3}
                  fill="oklch(0.97 0.005 85)"
                  fillOpacity={0.88}
                  stroke="oklch(0.15 0.02 50 / 0.18)"
                  strokeWidth={0.4}
                />
                <text
                  textAnchor="middle"
                  dy={4}
                  className="font-display"
                  style={{
                    fontSize: 11,
                    fill: "oklch(0.15 0.02 50)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {l.epdShort}
                </text>
              </g>
            ))}
        </g>
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border border-border bg-background px-3 py-2 text-xs shadow-lg"
          style={{ left: hover.x + 14, top: hover.y + 14 }}
        >
          <div className="font-display text-base leading-none">{hover.name}</div>
          <div className="mt-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
            Equal Pay Day {LABEL_YEAR}
          </div>
          <div className="font-display text-xl text-[var(--accent-magenta)]">{hover.epd}</div>
          <div className="mt-1 text-muted-foreground">
            {hover.days} days unpaid · {hover.gap.toFixed(1)}% gap · {hover.year}
          </div>
        </div>
      )}

      <Legend />
    </div>
  );
}

function Legend() {
  const stops = [0, 15, 30, 45, 60, 75];
  const scale = scaleLinear<string>()
    .domain([0, 30, 75])
    .range(["oklch(0.94 0.03 90)", "oklch(0.75 0.18 30)", "oklch(0.42 0.24 10)"])
    .clamp(true);
  return (
    <div className="absolute bottom-2 left-2 rounded-md border border-border bg-background/90 px-3 py-2 text-[10px] backdrop-blur">
      <div className="mb-1 uppercase tracking-widest text-muted-foreground">
        Days women work unpaid
      </div>
      <div className="flex items-center gap-1">
        {stops.map((s) => (
          <div key={s} className="flex flex-col items-center gap-1">
            <div className="h-3 w-8" style={{ background: scale(s) }} />
            <span>{s}d</span>
          </div>
        ))}
      </div>
    </div>
  );
}
